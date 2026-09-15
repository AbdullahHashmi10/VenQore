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
    const isOverdue = party.type === 'customer' && party.credit_limit && parseFloat(party.current_balance || 0) > parseFloat(party.credit_limit);


    const getTypeStyle = (type) => {
        const types = {
            sale: { label: 'Sale', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            purchase: { label: 'Purchase', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown },
            payment_in: { label: 'Received', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: ArrowDownCircle },
            payment_out: { label: 'Paid', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ArrowUpCircle },
            opening: { label: 'Opening', color: 'bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted', icon: Wallet },
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

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <ContactsModuleTabs activeTab="ledgers" />

                {isOverdue && (
                    <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 p-3 rounded-xl flex items-center justify-between shrink-0 mb-1">
                        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase">Credit Limit Exceeded: {formatCurrency(party.current_balance, store)} / Limit: {formatCurrency(party.credit_limit, store)}</span>
                        </div>
                    </div>
                )}

                {/* Mobile Stats Toggle/Summary */}
                <div className="sm:hidden flex items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1 text-2xs font-bold text-ink-muted uppercase shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={14} className={`transition-transform duration-normal ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {!isStatsExpanded && (
                        <div className="text-2xs font-bold text-ink-muted truncate">
                            <span className="text-emerald-600">Net: {formatCurrency(stats.final_balance || 0, store)}</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden sm:grid'}`}>
                    <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-sunken text-ink-secondary rounded-lg shrink-0">
                                <Wallet size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Opening</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-bold text-ink-secondary leading-none mt-1 sm:mt-0">{formatCurrency(stats.opening_balance, store)}</p>
                    </div>
                    <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                                <ArrowDownCircle size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Credits</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_credit, store)}</p>
                    </div>
                    <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                                <ArrowUpCircle size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Debits</p>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg font-bold text-red-600 leading-none mt-1 sm:mt-0">{formatCurrency(stats.total_debit, store)}</p>
                    </div>
                    <div className="bg-surface px-2.5 py-2 rounded-xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="p-1 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg shrink-0">
                                <TrendingUp size={14} />
                            </div>
                            <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-tight truncate">Net Balance</p>
                        </div>
                        <div className="text-left mt-1 sm:mt-0">
                            <p className={`text-sm sm:text-base md:text-lg font-bold leading-none ${stats.final_balance > 0 ? 'text-emerald-600' : (stats.final_balance < 0 ? 'text-red-600' : 'text-ink-muted')}`}>
                                {formatCurrency(Math.abs(stats.final_balance || 0), store)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Toolbar (sm:hidden) */}
                <div className="sm:hidden flex flex-col bg-surface rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-xs font-bold text-ink uppercase tracking-tight truncate max-w-[120px]">
                                    {party.name}
                                </h1>
                                <span className={`px-1.5 py-0.5 text-4xs font-bold uppercase rounded-full ${party.type === 'customer'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {party.type}
                                </span>
                            </div>
                            <p className="text-3xs text-ink-muted font-mono mt-0.5">{party.phone || 'No Phone'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Search"
                            >
                                <Search size={14} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Filter Type"
                            >
                                <Filter size={14} />
                            </button>
                            <div className="flex items-center border-l border-line pl-1.5 ml-0.5 gap-0.5">
                                <button className="p-1 text-emerald-600" title="Export">
                                    <Download size={14} />
                                </button>
                                <button className="p-1 text-ink-muted" title="Print">
                                    <Printer size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Expandable Mobile Search */}
                    {showMobileSearch && (
                        <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal">
                            <div className="relative w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search Ref or Desc..."
                                    className="w-full pl-8 pr-4 py-1.5 text-xs bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={12} />
                            </div>
                        </div>
                    )}

                    {/* Expandable Mobile Filters */}
                    {showMobileFilters && (
                        <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal">
                            <div className="flex items-center gap-1.5">
                                <span className="text-3xs font-bold text-ink-muted uppercase tracking-wider shrink-0">Type:</span>
                                <select
                                    value={transactionType}
                                    onChange={(e) => { setTransactionType(e.target.value); setShowMobileFilters(false); }}
                                    className="flex-1 bg-app border border-line text-ink-secondary text-xs font-bold rounded-lg px-2 py-1.5 outline-none"
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
                <div className="hidden sm:flex flex-row items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Party Name */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-bold text-ink uppercase tracking-tight">
                                    {party.name} <span className="text-brand-600">Ledger</span>
                                </h1>
                                <span className={`px-2 py-0.5 text-2xs font-bold uppercase rounded-full ${party.type === 'customer'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {party.type}
                                </span>
                            </div>
                            <p className="text-2xs text-ink-muted font-medium">
                                {party.phone || 'No Phone'} • {party.email || 'No Email'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Filters + Actions */}
                    <div className="flex items-center gap-2">
                        <select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                            className="bg-app border border-line text-ink-secondary text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-0 outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="sale">Sales</option>
                            <option value="purchase">Purchases</option>
                            <option value="payment_in">Received</option>
                            <option value="payment_out">Paid</option>
                        </select>

                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ref #"
                                className="pl-8 pr-2 py-1.5 text-xs bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-28"
                            />
                        </div>

                        <div className="flex items-center gap-0.5 border-l border-line pl-2">
                            <button className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600" title="Export">
                                <Download size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print">
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ledger Content Area */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app border-b border-line sticky top-0 z-10">
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Date</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Type</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Reference</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">You Gave</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">You Received</th>
                                    <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t, index) => {
                                        const typeStyle = getTypeStyle(t.type);
                                        const TypeIcon = typeStyle.icon;

                                        return (
                                            <tr key={index} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                <td className="p-3 text-xs font-medium text-ink-secondary whitespace-nowrap">
                                                    {new Date(t.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${typeStyle.color}`}>
                                                        <TypeIcon size={10} />
                                                        {typeStyle.label}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-xs font-bold text-ink hover:text-brand-600 transition-colors cursor-pointer">{t.reference || '-'}</p>
                                                    {t.description && <p className="text-2xs text-ink-muted truncate max-w-[200px]">{t.description}</p>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {t.debit > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(t.debit, store)}</span>
                                                    ) : <span className="text-neutral-300">-</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {t.credit > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(t.credit, store)}</span>
                                                    ) : <span className="text-neutral-300">-</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`text-xs font-mono font-bold ${t.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : (t.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-ink-muted')}`}>
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
                                        <td colSpan={6} className="p-12 text-center text-ink-muted">
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
                    <div className="block sm:hidden divide-y divide-line">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t, index) => {
                                const typeStyle = getTypeStyle(t.type);
                                const TypeIcon = typeStyle.icon;

                                return (
                                    <div key={index} className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xs text-ink-muted font-medium font-mono">
                                                {new Date(t.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${typeStyle.color}`}>
                                                <TypeIcon size={8} />
                                                {typeStyle.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-ink break-all">{t.reference || '-'}</p>
                                            {t.description && <p className="text-2xs text-ink-muted mt-0.5">{t.description}</p>}
                                        </div>
                                        <div className="flex items-center justify-between text-1xs pt-1.5 border-t border-dashed border-line mt-1">
                                            <div className="flex gap-2">
                                                {t.debit > 0 && (
                                                    <span className="text-red-600 dark:text-red-400 font-mono font-bold">Gave: {formatCurrency(t.debit, store)}</span>
                                                )}
                                                {t.credit > 0 && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Rec: {formatCurrency(t.credit, store)}</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-bold font-mono ${t.balance > 0 ? 'text-emerald-600' : (t.balance < 0 ? 'text-red-600' : 'text-ink-muted')}`}>
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
                            <div className="p-12 text-center text-ink-muted text-xs">
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
