import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    Search,
    Download,
    Phone,
    TrendingDown,
    FileText,
    Users,
    ChevronUp,
    ChevronDown,
    Printer,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Mail
} from 'lucide-react';

export default function Payables({ parties = [] }) {
    const { store } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });

    // Mobile responsiveness toggle states
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalPayable = parties.reduce((sum, p) => sum + (Math.abs(parseFloat(p.balance ?? p.current_balance ?? 0)) || 0), 0);
        const totalParties = parties.length;
        const avgPayable = totalParties > 0 ? totalPayable / totalParties : 0;
        const largestCreditor = parties.reduce((max, p) => (Math.abs(parseFloat(p.balance ?? p.current_balance ?? 0)) > Math.abs(parseFloat(max.balance ?? max.current_balance ?? 0)) ? p : max), {});

        return {
            totalPayable,
            totalParties,
            avgPayable,
            largestCreditor
        };
    }, [parties]);

    // Sort and Filter Data
    const filteredParties = useMemo(() => {
        let result = parties.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone && p.phone.includes(searchTerm))
        );

        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'balance') {
                valA = Math.abs(parseFloat(a.balance ?? a.current_balance ?? 0));
                valB = Math.abs(parseFloat(b.balance ?? b.current_balance ?? 0));
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [parties, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <OneGlanceLayout title="Accounts Payable" activeMenu="Money">
            <Head title="Payables" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="payables" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="sm:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {!isStatsExpanded && (
                        <div className="text-[10px] font-bold text-slate-500 truncate">
                            <span className="text-red-650 dark:text-red-400">Payable: {formatCurrency(stats.totalPayable || 0, store)}</span>
                            <span className="mx-1">|</span>
                            <span className="text-indigo-600">Creditors: {stats.totalParties}</span>
                        </div>
                    )}
                </div>

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden sm:grid'}`}>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Payable</p>
                        </div>
                        <p className="text-lg font-black text-red-600">{formatCurrency(stats.totalPayable, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Users size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Active Creditors</p>
                        </div>
                        <p className="text-lg font-black text-indigo-600">{stats.totalParties}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Avg Balance</p>
                        </div>
                        <p className="text-lg font-black text-blue-600">{formatCurrency(stats.avgPayable, store)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Highest Creditor</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-lg font-black text-rose-600 leading-none">{formatCurrency(parseFloat(stats.largestCreditor.balance ?? stats.largestCreditor.current_balance ?? 0), store)}</p>
                            {stats.largestCreditor.name && (
                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[100px] mt-0.5">{stats.largestCreditor.name}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Header Bar - Title + Search + Actions (hidden on mobile, replaced by Mobile Toolbar) */}
                <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Accounts <span className="text-red-600">Payable</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Money Out</span>
                    </div>

                    {/* Right: Search + Export */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search suppliers..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-56"
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

                {/* Mobile Toolbar (sm:hidden) */}
                <div className="sm:hidden flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center justify-between px-3 py-2">
                        <h1 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            Accounts <span className="text-red-600">Payable</span>
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowMobileSearch(!showMobileSearch)}
                                className={`p-1.5 rounded-lg transition-colors ${showMobileSearch ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                title="Search"
                            >
                                <Search size={14} />
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
                                    placeholder="Search suppliers..."
                                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                                />
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Table (Desktop only) */}
                <div className="hidden sm:block flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Supplier {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Since</th>
                                <th
                                    className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => handleSort('balance')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Payable {sortConfig.key === 'balance' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </div>
                                </th>
                                <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredParties.length > 0 ? (
                                filteredParties.map((party) => (
                                    <tr key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm">
                                                    {party.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{party.name}</p>
                                                    <p className="text-[10px] text-slate-500">Supplier</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs">
                                                    <Phone size={12} /> {party.phone || '-'}
                                                </div>
                                                {party.email && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                                        <Mail size={10} /> {party.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p className="text-xs text-slate-500">{new Date(party.updated_at || party.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-3 text-right">
                                            <p className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(party.balance ?? party.current_balance ?? 0, store)}</p>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                <Link
                                                    href={route('store.payments.out', { store_slug: store?.slug, party_id: party.id })}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Record Payment"
                                                >
                                                    <CreditCard size={14} />
                                                </Link>
                                                <Link
                                                    href={route('store.parties.ledger', { store_slug: store?.slug, party: party.id })}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                    title="View Ledger"
                                                >
                                                    <FileText size={14} /> Ledger
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <TrendingDown size={32} className="opacity-20" />
                                            <p className="text-sm font-medium">No pending payables found</p>
                                            <p className="text-xs text-slate-500">Excellent! All suppliers are paid.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List (Mobile only) */}
                <div className="block sm:hidden flex-1 overflow-auto space-y-1.5">
                    {filteredParties.length > 0 ? (
                        filteredParties.map((party) => (
                            <div key={party.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm">
                                            {party.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{party.name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Since: {new Date(party.updated_at || party.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                        {formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-1">
                                    <div className="flex flex-col text-[10px] text-slate-500">
                                        {party.phone && <span className="font-medium text-slate-600 dark:text-slate-400">📞 {party.phone}</span>}
                                        {party.email && <span className="truncate max-w-[150px]">✉️ {party.email}</span>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={route('store.payments.out', { store_slug: store?.slug, party_id: party.id })}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center"
                                            title="Record Payment"
                                        >
                                            <CreditCard size={14} />
                                        </Link>
                                        <Link
                                            href={route('store.parties.ledger', { store_slug: store?.slug, party: party.id })}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                            title="View Ledger"
                                        >
                                            <FileText size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-col items-center gap-2">
                                <TrendingDown size={32} className="opacity-20" />
                                <p className="text-sm font-medium">No pending payables found</p>
                                <p className="text-xs text-slate-500">Excellent! All suppliers are paid.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
