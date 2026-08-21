import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, Link } from '@inertiajs/react';
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
    const { store } = usePage().props;
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
            asset: { label: 'Asset', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: Briefcase },
            liability: { label: 'Liability', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: ArrowDownCircle },
            equity: { label: 'Equity', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: PieChart },
            income: { label: 'Income', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            expense: { label: 'Expense', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle }
        };
        return configs[type] || { label: type, color: 'bg-neutral-100 text-ink-secondary', icon: BookOpen };
    };



    return (
        <ReportsLayout title="Chart of Accounts">
            <Head title="COA" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">



                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg"><Briefcase size={16} /></div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Assets</p>
                        </div>
                        <p className="text-lg font-bold text-brand-600">{formatCurrency(stats.assets)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg"><ArrowDownCircle size={16} /></div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Liabilities</p>
                        </div>
                        <p className="text-lg font-bold text-rose-600">{formatCurrency(stats.liabilities)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><TrendingUp size={16} /></div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Income (YTD)</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.income)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><ArrowUpCircle size={16} /></div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Expense (YTD)</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.expenses)}</p>
                    </div>
                </div>

                {/* Header & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {['all', 'asset', 'liability', 'equity', 'income', 'expense'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all whitespace-nowrap ${typeFilter === type
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search accounts..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-48"
                            />
                        </div>
                        <button className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                            <Plus size={14} /> New Account
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th onClick={() => handleSort('code')} className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover">Code</th>
                                <th onClick={() => handleSort('name')} className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover">Account Name</th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Type</th>
                                <th onClick={() => handleSort('balance')} className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right cursor-pointer hover:bg-sunken dark:hover:bg-interactive-hover">Balance</th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {processedAccounts.length > 0 ? (
                                processedAccounts.map((account) => {
                                    const typeConfig = getTypeConfig(account.type);
                                    const Icon = typeConfig.icon;
                                    return (
                                        <tr key={account.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
                                            <td className="p-3">
                                                <span className="font-mono text-xs font-bold text-ink-muted bg-sunken px-1.5 py-0.5 rounded">{account.code}</span>
                                            </td>
                                            <td className="p-3">
                                                <p className="text-sm font-bold text-ink-secondary dark:text-ink">{account.name}</p>
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold uppercase ${typeConfig.color}`}>
                                                    <Icon size={10} />
                                                    {typeConfig.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-mono text-sm font-bold text-ink">
                                                    {formatCurrency(account.balance)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600" title="View Ledger">
                                                        <FileText size={14} />
                                                    </button>
                                                    <button className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600" title="Edit">
                                                        <Eye size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-ink-muted">
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
