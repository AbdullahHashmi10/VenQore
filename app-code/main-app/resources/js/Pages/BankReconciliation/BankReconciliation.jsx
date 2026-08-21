import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { usePage, Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs'; // Added
import {
    Scale,
    Upload,
    Download,
    CheckCircle,
    Clock,
    ArrowUpDown,
    DollarSign,
    FileText,
    Link2,
    Calendar,
    Filter
} from 'lucide-react';

export default function BankReconciliationIndex({
    bankAccounts = [],
    transactions = [],
    unmatchedBank = [],
    unmatchedSystem = []
}) {
    const [selectedAccount, setSelectedAccount] = useState(bankAccounts[0]?.id || '');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [viewMode, setViewMode] = useState('unmatched'); // 'all', 'matched', 'unmatched'

    // Normalize data to arrays (handling potential paginated responses or nulls)
    const transactionList = useMemo(() => Array.isArray(transactions) ? transactions : (transactions?.data || []), [transactions]);
    const bankList = useMemo(() => Array.isArray(unmatchedBank) ? unmatchedBank : (unmatchedBank?.data || []), [unmatchedBank]);
    const systemList = useMemo(() => Array.isArray(unmatchedSystem) ? unmatchedSystem : (unmatchedSystem?.data || []), [unmatchedSystem]);

    // Stats
    const stats = useMemo(() => {
        return {
            totalTransactions: transactionList.length,
            matched: transactionList.filter(t => t.is_reconciled).length,
            unmatched: transactionList.filter(t => !t.is_reconciled).length,
            difference: bankList.reduce((s, t) => s + parseFloat(t.amount || 0), 0) -
                systemList.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
        };
    }, [transactionList, bankList, systemList]);

    const getStatusBadge = (isReconciled) => {
        if (isReconciled) {
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        }
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    };

    const { store } = usePage().props;


    return (
        <OneGlanceLayout title="Bank Reconciliation" activeMenu="Banking">
            <Head title="Bank Reconciliation" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="reconciliation" className="!mb-0" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Txns</p>
                        </div>
                        <p className="text-base font-bold text-ink">{stats.totalTransactions}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Matched</p>
                        </div>
                        <p className="text-base font-bold text-emerald-600">{stats.matched}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Unmatched</p>
                        </div>
                        <p className="text-base font-bold text-amber-600">{stats.unmatched}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${stats.difference === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Difference</p>
                        </div>
                        <p className={`text-base font-bold ${stats.difference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(Math.abs(stats.difference))}
                        </p>
                    </div>
                </div>

                {/* Header Bar: Title + Filters + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Bank <span className="text-brand-600">Reconciliation</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>

                        {/* View Filters */}
                        <div className="flex bg-sunken rounded-lg p-0.5">
                            {['unmatched', 'matched', 'all'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 text-2xs font-bold uppercase rounded-md transition-all ${viewMode === mode
                                            ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm'
                                            : 'text-ink-muted hover:text-ink-secondary'
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Account Select */}
                        <div className="relative">
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="pl-3 pr-8 py-1.5 text-xs font-bold bg-app border-none rounded-lg focus:ring-1 focus:ring-brand-500 text-ink-secondary dark:text-ink w-40 truncate appearance-none cursor-pointer hover:bg-interactive-hover"
                            >
                                {bankAccounts.length === 0 ? <option value="">No Accounts</option> : bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                            <Filter size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center bg-app rounded-lg p-0.5">
                            <Calendar size={14} className="text-ink-muted ml-2" />
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="bg-transparent border-none text-xs font-bold text-ink-secondary p-1 w-24 focus:ring-0"
                            />
                            <span className="text-neutral-300">-</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="bg-transparent border-none text-xs font-bold text-ink-secondary p-1 w-24 focus:ring-0"
                            />
                        </div>

                        <div className="h-4 w-px bg-sunken mx-1"></div>

                        {/* Actions */}
                        <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Import Statement">
                            <Upload size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Export Report">
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {/* View Mode: UNMATCHED (Split View) */}
                    {viewMode === 'unmatched' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
                            {/* Bank Side */}
                            <div className="bg-surface rounded-xl border border-line flex flex-col h-full overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 text-sm">
                                        <FileText size={16} /> Unmatched (Bank)
                                    </h3>
                                    <span className="text-xs font-bold bg-surface text-blue-600 px-2 py-0.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30">{bankList.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {bankList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-ink-muted p-8">
                                            <CheckCircle size={32} className="mb-2 text-emerald-400 opacity-50" />
                                            <p className="text-sm font-medium">All bank records matched</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-line">
                                            {bankList.map((item, idx) => (
                                                <div key={idx} className="p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-ink text-sm truncate">{item.description || 'Transaction'}</p>
                                                            <p className="text-2xs text-ink-muted font-mono mt-0.5">{item.date}</p>
                                                        </div>
                                                        <span className={`text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {formatCurrency(Math.abs(parseFloat(item.amount || 0)))}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Side */}
                            <div className="bg-surface rounded-xl border border-line flex flex-col h-full overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 text-sm">
                                        <ArrowUpDown size={16} /> Unmatched (System)
                                    </h3>
                                    <span className="text-xs font-bold bg-surface text-purple-600 px-2 py-0.5 rounded-md shadow-sm border border-purple-100 dark:border-purple-900/30">{systemList.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {systemList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-ink-muted p-8">
                                            <CheckCircle size={32} className="mb-2 text-emerald-400 opacity-50" />
                                            <p className="text-sm font-medium">All system records matched</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-line">
                                            {systemList.map((item, idx) => (
                                                <div key={idx} className="p-3 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 cursor-pointer transition-colors group">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-ink text-sm truncate">{item.description || item.reference || 'Transaction'}</p>
                                                            <p className="text-2xs text-ink-muted font-mono mt-0.5">{item.date}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {formatCurrency(Math.abs(parseFloat(item.amount || 0)))}
                                                            </span>
                                                            <button className="p-1 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded opacity-0 group-hover:opacity-100 transition-all">
                                                                <Link2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Mode: TABLE (All/Matched) */}
                    {viewMode !== 'unmatched' && (
                        <div className="bg-surface rounded-xl border border-line flex flex-col h-full overflow-hidden shadow-sm">
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-app backdrop-blur z-10 border-b border-line">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold text-ink-muted uppercase">Date</th>
                                            <th className="px-4 py-3 text-xs font-bold text-ink-muted uppercase">Description</th>
                                            <th className="px-4 py-3 text-xs font-bold text-ink-muted uppercase">Reference</th>
                                            <th className="px-4 py-3 text-xs font-bold text-ink-muted uppercase text-right">Amount</th>
                                            <th className="px-4 py-3 text-xs font-bold text-ink-muted uppercase text-center">Status</th>
                                            <th className="px-4 py-3 text-xs font-bold text-ink-muted uppercase text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {transactionList.filter(t => viewMode === 'all' || (viewMode === 'matched' && t.is_reconciled)).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Scale size={32} className="text-neutral-300 dark:text-ink-secondary mb-2" />
                                                        <p className="text-ink-muted font-medium text-sm">No transactions found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            transactionList.filter(t => viewMode === 'all' || (viewMode === 'matched' && t.is_reconciled)).map((item) => (
                                                <tr key={item.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                    <td className="px-4 py-3 text-sm text-ink-secondary font-mono">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-ink">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-ink-muted">
                                                        {item.reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-bold">
                                                        <span className={parseFloat(item.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {formatCurrency(Math.abs(parseFloat(item.amount || 0)))}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${getStatusBadge(item.is_reconciled)}`}>
                                                            {item.is_reconciled ? 'Matched' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button className="p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all">
                                                            <Link2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
