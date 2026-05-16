import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import SellModuleTabs from '@/Components/SellModuleTabs';
import SmartCombobox from '@/Components/SmartCombobox';
import {
    FileText,
    Clock,
    AlertTriangle,
    Package,
    Search,
    Printer,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    ChevronUp,
    ChevronDown,
    MoreVertical
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export default function BestPreSales({ presales = [], stats = {} }) {
    const {
        store
    } = usePage().props;

    const defaultData = presales?.data || presales || [];
    const [sortedData, setSortedData] = useState(defaultData);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // Sort Config
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'date', label: 'Date', width: '15%' },
        { key: 'reference', label: 'Quote No', width: '20%' },
        { key: 'customer', label: 'Customer', width: '25%' },
        { key: 'amount', label: 'Amount', width: '15%' },
        { key: 'status', label: 'Status', width: '15%' },
        { key: 'actions', label: 'Actions', width: '10%', frozen: true }
    ]);

    useEffect(() => {
        setSortedData(defaultData);
    }, [presales]);

    // Handlers
    const handleSearch = (term) => {
        setSearchTerm(term);
        if (!term) {
            setSortedData(defaultData);
        } else {
            const lower = term.toLowerCase();
            const filtered = defaultData.filter(item =>
                (item.reference_number?.toLowerCase() || '').includes(lower) ||
                (item.customer?.name?.toLowerCase() || '').includes(lower)
            );
            setSortedData(filtered);
        }
    };

    const applyFilter = (type) => {
        setActiveFilter(type);
        if (type === 'all') {
            setSortedData(defaultData);
        } else {
            setSortedData(defaultData.filter(item => item.status === type));
        }
    };

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });

        const sorted = [...sortedData].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (key === 'date') { valA = a.created_at; valB = b.created_at; }
            if (key === 'reference') { valA = a.reference_number; valB = b.reference_number; }
            if (key === 'customer') { valA = a.customer?.name; valB = b.customer?.name; }
            if (key === 'amount') { valA = parseFloat(a.total || 0); valB = parseFloat(b.total || 0); }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setSortedData(sorted);
    };

    // Formatters
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

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

    return (
        <OneGlanceLayout title="Pre-Sales History" activeMenu="Sell">
            <Head title="Pre-Sales / Quotations" />
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <SellModuleTabs activeTab="presales" />

                {/* Stats Cards - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Quotes</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.total_count || defaultData.length}</p>
                    </div>
                    {/* Add more stats if available in props, otherwise placeholders or remove */}
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                        </div>
                        <p className="text-base font-black text-blue-600">{defaultData.filter(i => i.status === 'pending').length}</p>
                    </div>
                </div>

                {/* Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0 flex items-center gap-2">
                            Pre-Sales <span className="text-amber-600">Quotations</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => applyFilter('all')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >All</button>
                        <button
                            onClick={() => applyFilter('pending')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Pending</button>
                        <button
                            onClick={() => applyFilter('converted')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === 'converted' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                        >Converted</button>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-52">
                            <SmartCombobox
                                items={defaultData}
                                value={searchTerm}
                                onQueryChange={handleSearch}
                                onSelect={(item) => setSearchTerm(item.reference_number)}
                                placeholder="Search quotes..."
                                displayKey="reference_number"
                                filterKey="reference_number"
                                inputClassName="py-1.5 text-xs h-9"
                            />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link href={route("store.sales.presale.create", {
                                store_slug: store.slug
                            })} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors">
                                <FileText size={14} /> New Quote
                            </Link>
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
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-amber-500" />
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
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No pre-sales found</p>
                                            <p className="text-sm text-slate-500 mb-4">Create your first quotation</p>
                                            <Link
                                                href={route("store.sales.presale.create", {
                                                    store_slug: store.slug
                                                })}
                                                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors flex items-center gap-2"
                                            >
                                                <FileText size={16} /> New Quote
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => {/* router.visit(route('store.pre-sales.show', row.id)) */ }}
                                        className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group cursor-pointer"
                                    >
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'date':
                                                            return <span className="font-medium">{formatDate(row.created_at)}</span>;
                                                        case 'reference':
                                                            return <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{row.reference_number || '---'}</span>;
                                                        case 'customer':
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                        {(row.customer?.name || 'W').charAt(0)}
                                                                    </div>
                                                                    <span>{row.customer?.name || 'Walk-in'}</span>
                                                                </div>
                                                            );
                                                        case 'amount':
                                                            return <span className="font-bold">{formatCurrency(row.total)}</span>;
                                                        case 'status':
                                                            const styles = {
                                                                pending: 'bg-amber-100 text-amber-700',
                                                                converted: 'bg-emerald-100 text-emerald-700'
                                                            };
                                                            return <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${styles[row.status] || 'bg-slate-100 text-slate-700'}`}>{row.status || 'pending'}</span>;
                                                        case 'actions':
                                                            return (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {/* Add action buttons here when routes are available */}
                                                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                                                                        <MoreVertical size={16} />
                                                                    </button>
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
        </OneGlanceLayout>
    );
}
