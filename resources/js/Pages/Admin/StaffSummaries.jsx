import React, { useState, useMemo } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';
import {
    TrendingUp,
    Package,
    Clock,
    DollarSign,
    Users,
    Search,
    Download,
    Calendar,
    Award,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    Printer
} from 'lucide-react';

export default function StaffSummaries({ staffData = [] }) {
    const { store } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState('sales'); // 'sales', 'transactions', 'avg'

    // Calculate aggregated stats
    const stats = useMemo(() => {
        return {
            totalStaff: staffData.length,
            totalSales: staffData.reduce((sum, s) => sum + (s.totalSales || 0), 0),
            totalTransactions: staffData.reduce((sum, s) => sum + (s.transactionCount || 0), 0),
            topPerformer: staffData.reduce((prev, current) => (prev.totalSales > current.totalSales) ? prev : current, {})
        };
    }, [staffData]);

    // Filter and sort staff
    const filteredStaff = useMemo(() => {
        let result = staffData.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        result.sort((a, b) => {
            if (sortConfig === 'sales') return b.totalSales - a.totalSales;
            if (sortConfig === 'transactions') return b.transactionCount - a.transactionCount;
            if (sortConfig === 'avg') return b.avgTransaction - a.avgTransaction;
            return 0;
        });

        return result;
    }, [staffData, searchTerm, sortConfig]);

    const formatCurrency = (value) => {
        return (getCurrencySymbol()) + ' ' + (parseFloat(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    };

    return (
        <OneGlanceLayout title="Staff Performance" activeMenu="Staff Summaries" mode="admin">
            <Head title="Staff Performance" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <ContactsModuleTabs activeTab="summaries" />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Users size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Active Staff</p>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalStaff}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Sales</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(stats.totalSales)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Transactions</p>
                        </div>
                        <p className="text-lg font-black text-blue-600">{stats.totalTransactions}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Award size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Top Performer</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{stats.topPerformer.name || '-'}</p>
                            <p className="text-[10px] text-emerald-500 font-bold">{formatCurrency(stats.topPerformer.totalSales || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Header Bar - Title + Sort Pills + Search */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title + Sort Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Staff <span className="text-indigo-600">Performance</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Sort By:</span>
                        <button
                            onClick={() => setSortConfig('sales')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${sortConfig === 'sales'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Total Sales</button>
                        <button
                            onClick={() => setSortConfig('transactions')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${sortConfig === 'transactions'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 ring-1 ring-blue-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Transactions</button>
                        <button
                            onClick={() => setSortConfig('avg')}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${sortConfig === 'avg'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 ring-1 ring-purple-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                }`}
                        >Avg. Ticket</button>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search staff..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
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

                {/* Staff Cards Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map((staff, index) => (
                                <div key={staff.id} className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
                                    {/* Top Performer Badge */}
                                    {index === 0 && sortConfig === 'sales' && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                            <Award size={10} /> Top Sales
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                            index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/20' :
                                                    'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
                                            }`}>
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white truncate">{staff.name}</h3>
                                            <p className="text-xs text-slate-500">{staff.role}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <DollarSign size={14} />
                                                <span className="text-xs font-medium">Total Sales</span>
                                            </div>
                                            <span className="font-bold text-sm text-slate-800 dark:text-white">
                                                {formatCurrency(staff.totalSales)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                                    <Package size={12} />
                                                    <span className="text-[10px] font-bold uppercase">Txns</span>
                                                </div>
                                                <p className="font-bold text-slate-800 dark:text-white">{staff.transactionCount}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                                    <TrendingUp size={12} />
                                                    <span className="text-[10px] font-bold uppercase">Avg</span>
                                                </div>
                                                <p className="font-bold text-slate-800 dark:text-white max-w-full truncate" title={formatCurrency(staff.avgTransaction)}>
                                                    {getCurrencySymbol()} {staff.avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                Last Active:
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{staff.lastActive}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Users size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-white">No staff found</h3>
                                <p className="text-slate-500">Try adjusting your search criteria</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
