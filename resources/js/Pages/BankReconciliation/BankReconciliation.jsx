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

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="reconciliation" className="!mb-0" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Txns</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats.totalTransactions}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Matched</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{stats.matched}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Unmatched</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{stats.unmatched}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${stats.difference === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Difference</p>
                        </div>
                        <p className={`text-base font-black ${stats.difference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(Math.abs(stats.difference))}
                        </p>
                    </div>
                </div>

                {/* Header Bar: Title + Filters + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Bank <span className="text-indigo-600">Reconciliation</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        {/* View Filters */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            {['unmatched', 'matched', 'all'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === mode
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
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
                                className="pl-3 pr-8 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 w-40 truncate appearance-none cursor-pointer hover:bg-slate-100"
                            >
                                {bankAccounts.length === 0 ? <option value="">No Accounts</option> : bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                            <Filter size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5">
                            <Calendar size={14} className="text-slate-400 ml-2" />
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="bg-transparent border-none text-xs font-bold text-slate-600 p-1 w-24 focus:ring-0"
                            />
                            <span className="text-slate-300">-</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="bg-transparent border-none text-xs font-bold text-slate-600 p-1 w-24 focus:ring-0"
                            />
                        </div>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        {/* Actions */}
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Import Statement">
                            <Upload size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Export Report">
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
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 text-sm">
                                        <FileText size={16} /> Unmatched (Bank)
                                    </h3>
                                    <span className="text-xs font-bold bg-white dark:bg-slate-800 text-blue-600 px-2 py-0.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-900/30">{bankList.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {bankList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                            <CheckCircle size={32} className="mb-2 text-emerald-400 opacity-50" />
                                            <p className="text-sm font-medium">All bank records matched</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {bankList.map((item, idx) => (
                                                <div key={idx} className="p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{item.description || 'Transaction'}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.date}</p>
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
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2 text-sm">
                                        <ArrowUpDown size={16} /> Unmatched (System)
                                    </h3>
                                    <span className="text-xs font-bold bg-white dark:bg-slate-800 text-purple-600 px-2 py-0.5 rounded-md shadow-sm border border-purple-100 dark:border-purple-900/30">{systemList.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {systemList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                            <CheckCircle size={32} className="mb-2 text-emerald-400 opacity-50" />
                                            <p className="text-sm font-medium">All system records matched</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {systemList.map((item, idx) => (
                                                <div key={idx} className="p-3 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 cursor-pointer transition-colors group">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{item.description || item.reference || 'Transaction'}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.date}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold whitespace-nowrap ${parseFloat(item.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {formatCurrency(Math.abs(parseFloat(item.amount || 0)))}
                                                            </span>
                                                            <button className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded opacity-0 group-hover:opacity-100 transition-all">
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
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm">
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Reference</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactionList.filter(t => viewMode === 'all' || (viewMode === 'matched' && t.is_reconciled)).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Scale size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                                                        <p className="text-slate-500 font-medium text-sm">No transactions found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            transactionList.filter(t => viewMode === 'all' || (viewMode === 'matched' && t.is_reconciled)).map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-500">
                                                        {item.reference || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-bold">
                                                        <span className={parseFloat(item.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {formatCurrency(Math.abs(parseFloat(item.amount || 0)))}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(item.is_reconciled)}`}>
                                                            {item.is_reconciled ? 'Matched' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
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
