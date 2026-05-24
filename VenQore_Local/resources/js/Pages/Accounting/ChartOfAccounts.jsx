import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    FileText,
    LayoutDashboard,
    PieChart,
    BarChart3,
    ArrowUpCircle,
    ArrowDownCircle,
    Copy,
    Trash2,
    Eye,
    ChevronUp,
    ChevronDown,
    Printer,
    Download,
    TrendingUp,
    Briefcase
} from 'lucide-react';

export default function ChartOfAccounts({ accounts = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });

    // Calculate Stats
    const stats = useMemo(() => {
        return {
            assets: accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
            liabilities: accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
            income: accounts.filter(a => a.type === 'income').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
            expenses: accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
        };
    }, [accounts]);

    // Process Data
    const processedAccounts = useMemo(() => {
        let result = accounts.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (typeFilter === 'all' || item.type === typeFilter)
        );

        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'balance') {
                valA = parseFloat(a.balance || 0);
                valB = parseFloat(b.balance || 0);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [accounts, searchTerm, typeFilter, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getTypeConfig = (type) => {
        const configs = {
            asset: { label: 'Asset', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Briefcase },
            liability: { label: 'Liability', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: ArrowDownCircle },
            equity: { label: 'Equity', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: PieChart },
            income: { label: 'Income', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            expense: { label: 'Expense', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle }
        };
        return configs[type] || { label: type, color: 'bg-slate-100 text-slate-700', icon: BookOpen };
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val).replace('PKR', 'Rs');

    return (
        <ReportsLayout title="Chart of Accounts">
            <Head title="COA" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">



                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Briefcase size={16} /></div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Assets</p>
                        </div>
                        <p className="text-lg font-black text-indigo-600">{formatCurrency(stats.assets)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg"><ArrowDownCircle size={16} /></div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Liabilities</p>
                        </div>
                        <p className="text-lg font-black text-rose-600">{formatCurrency(stats.liabilities)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><TrendingUp size={16} /></div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Income (YTD)</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(stats.income)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><ArrowUpCircle size={16} /></div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Expense (YTD)</p>
                        </div>
                        <p className="text-lg font-black text-amber-600">{formatCurrency(stats.expenses)}</p>
                    </div>
                </div>

                {/* Header & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {['all', 'asset', 'liability', 'equity', 'income', 'expense'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all whitespace-nowrap ${typeFilter === type
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search accounts..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-48"
                            />
                        </div>
                        <button className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                            <Plus size={14} /> New Account
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th onClick={() => handleSort('code')} className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">Code</th>
                                <th onClick={() => handleSort('name')} className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">Account Name</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th onClick={() => handleSort('balance')} className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">Balance</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {processedAccounts.length > 0 ? (
                                processedAccounts.map((account) => {
                                    const typeConfig = getTypeConfig(account.type);
                                    const Icon = typeConfig.icon;
                                    return (
                                        <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-3">
                                                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{account.code}</span>
                                            </td>
                                            <td className="p-3">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{account.name}</p>
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeConfig.color}`}>
                                                    <Icon size={10} />
                                                    {typeConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                                                    {formatCurrency(account.balance)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600" title="View Ledger">
                                                        <FileText size={14} />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600" title="Edit">
                                                        <Eye size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <BookOpen size={24} className="opacity-50" />
                                            <p className="text-sm font-medium">No accounts found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ReportsLayout>
    );
}
