import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';
import {
    FileText,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    Download,
    Printer,
    Search,
    ChevronUp,
    ChevronDown,
    Filter
} from 'lucide-react';

export default function PartyLedger({ party = {}, transactions = [], stats = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [transactionType, setTransactionType] = useState('all');

    // Mobile responsiveness toggle states
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Format currency
    const { store } = usePage().props;


    const getTypeStyle = (type) => {
        const types = {
            sale: { label: 'Sale', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            purchase: { label: 'Purchase', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown },
            payment_in: { label: 'Received', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: ArrowDownCircle },
            payment_out: { label: 'Paid', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ArrowUpCircle },
            opening: { label: 'Opening', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: Wallet },
            return: { label: 'Return', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle },
        };
        return types[type] || types.opening;
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = !searchTerm ||
                t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = transactionType === 'all' || t.type === transactionType;

            // Basic date filter (can be enhanced)
            const matchesDate = (!dateRange.start || t.date >= dateRange.start) &&
                (!dateRange.end || t.date <= dateRange.end);

            return matchesSearch && matchesType && matchesDate;
        });
    }, [transactions, searchTerm, transactionType, dateRange]);

    return (
        <OneGlanceLayout title={`Ledger - ${party.name}`} activeMenu="Contacts">
            <Head title={`Ledger - ${party.name}`} />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <ContactsModuleTabs activeTab="ledgers" />

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
                            <span className="text-emerald-600">Net: {formatCurrency(stats.final_balance || 0, store)}</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden sm:grid'}`}>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg shrink-0">
                                <Wallet size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Opening</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-slate-700 dark:text-slate-300 leading-none mt-1 sm:mt-0">{formatCurrency(stats.opening_balance, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                                <ArrowDownCircle size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Credits</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-emerald-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_credit, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                                <ArrowUpCircle size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Debits</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-black text-red-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_debit, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                <TrendingUp size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate">Net Balance</p>
                        </div>
                        <div className="text-left mt-1 sm:mt-0">
                            <p className={`text-sm sm:text-base md:text-lg font-black leading-none ${stats.final_balance > 0 ? 'text-emerald-600' : (stats.final_balance < 0 ? 'text-red-600' : 'text-slate-500')}`}>
                                {formatCurrency(Math.abs(stats.final_balance || 0), store)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Toolbar (sm:hidden) */}
                <div className="sm:hidden flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[120px]">
                                    {party.name}
                                </h1>
                                <span className={`px-1.5 py-0.5 text-4xs font-bold uppercase rounded-full ${party.type === 'customer'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {party.type}
                                </span>
                            </div>
                            <p className="text-3xs text-slate-400 font-mono mt-0.5">{party.phone || 'No Phone'}</p>
                        </div>
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
                                    placeholder="Search Ref or Desc..."
                                    className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                            </div>
                        </div>
                    )}

                    {/* Expandable Mobile Filters */}
                    {showMobileFilters && (
                        <div className="px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200">
                            <div className="flex items-center gap-1.5">
                                <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Type:</span>
                                <select
                                    value={transactionType}
                                    onChange={(e) => { setTransactionType(e.target.value); setShowMobileFilters(false); }}
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-2 py-1.5 outline-none"
                                >
                                    <option value="all">All Types</option>
                                    <option value="sale">Sales</option>
                                    <option value="purchase">Purchases</option>
                                    <option value="payment_in">Received</option>
                                    <option value="payment_out">Paid</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Header Bar (sm:flex, hidden on mobile) */}
                <div className="hidden sm:flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Party Name */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {party.name} <span className="text-indigo-600">Ledger</span>
                                </h1>
                                <span className={`px-2 py-0.5 text-2xs font-bold uppercase rounded-full ${party.type === 'customer'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {party.type}
                                </span>
                            </div>
                            <p className="text-2xs text-slate-500 font-medium">
                                {party.phone || 'No Phone'} • {party.email || 'No Email'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Filters + Actions */}
                    <div className="flex items-center gap-2">
                        <select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-0 outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="sale">Sales</option>
                            <option value="purchase">Purchases</option>
                            <option value="payment_in">Received</option>
                            <option value="payment_out">Paid</option>
                        </select>

                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ref #"
                                className="pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-28"
                            />
                        </div>

                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ledger Content Area */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Type</th>
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference</th>
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">You Gave</th>
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">You Received</th>
                                    <th className="p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t, index) => {
                                        const typeStyle = getTypeStyle(t.type);
                                        const TypeIcon = typeStyle.icon;

                                        return (
                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-3 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(t.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${typeStyle.color}`}>
                                                        <TypeIcon size={10} />
                                                        {typeStyle.label}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer">{t.reference || '-'}</p>
                                                    {t.description && <p className="text-2xs text-slate-400 truncate max-w-[200px]">{t.description}</p>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {t.debit > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(t.debit, store)}</span>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {t.credit > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(t.credit, store)}</span>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`text-xs font-mono font-black ${t.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : (t.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500')}`}>
                                                        {formatCurrency(Math.abs(t.balance), store)}
                                                    </span>
                                                    {t.balance !== 0 && (
                                                        <span className={`text-3xs font-bold ml-1 uppercase ${t.balance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {t.balance > 0 ? 'To Receive' : 'To Pay'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400">
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
                    <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t, index) => {
                                const typeStyle = getTypeStyle(t.type);
                                const TypeIcon = typeStyle.icon;

                                return (
                                    <div key={index} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/10 flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xs text-slate-500 font-medium font-mono">
                                                {new Date(t.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${typeStyle.color}`}>
                                                <TypeIcon size={8} />
                                                {typeStyle.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-slate-800 dark:text-white break-all">{t.reference || '-'}</p>
                                            {t.description && <p className="text-2xs text-slate-400 mt-0.5">{t.description}</p>}
                                        </div>
                                        <div className="flex items-center justify-between text-1xs pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800/60 mt-1">
                                            <div className="flex gap-2">
                                                {t.debit > 0 && (
                                                    <span className="text-red-600 dark:text-red-400 font-mono font-bold">Gave: {formatCurrency(t.debit, store)}</span>
                                                )}
                                                {t.credit > 0 && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Rec: {formatCurrency(t.credit, store)}</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-black font-mono ${t.balance > 0 ? 'text-emerald-600' : (t.balance < 0 ? 'text-red-600' : 'text-slate-500')}`}>
                                                    {formatCurrency(Math.abs(t.balance), store)}
                                                </span>
                                                {t.balance !== 0 && (
                                                    <span className={`text-4xs font-bold ml-0.5 uppercase ${t.balance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {t.balance > 0 ? 'Rec' : 'Pay'}
                                                    </span>
                                                )}
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

                </div>
            </div>
        </OneGlanceLayout>
    );
}
