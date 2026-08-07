import React, { useState, useMemo } from 'react';
import { usePage, Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    Wallet, 
    ArrowLeft, 
    Search, 
    Filter,
    Minus,
    MoreVertical,
    Printer,
    Download
} from 'lucide-react';

export default function CashHistory({ balance, ledger }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredLedger = useMemo(() => {
        let data = [...ledger];
        if (filterType === 'in') data = data.filter(item => item.mode === 'in');
        if (filterType === 'out') data = data.filter(item => item.mode === 'out');

        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            data = data.filter(item => 
                item.name.toLowerCase().includes(low) || 
                item.type.toLowerCase().includes(low) ||
                item.description.toLowerCase().includes(low)
            );
        }
        return data;
    }, [ledger, filterType, searchTerm]);

    return (
        <OneGlanceLayout title="Cash Ledger" activeMenu="Money">
            <Head title="Cash In Hand" />

            <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-slate-950 overflow-hidden">
                
                {/* Top Toolbar (Similar to screenshot) */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href={route('store.funds.index', { store_slug: store.slug })} className="text-slate-400 hover:text-slate-600">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Cash In Hand</h1>
                            <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm">
                                Rs {balance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <Printer size={18} />
                        </button>
                        <button className="px-4 py-2 bg-[#d11124] text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition-colors">
                            Adjust Cash
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Transactions</h2>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search Transactions"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-xs font-bold rounded ${filterType === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'text-slate-500'}`}>All</button>
                            <button onClick={() => setFilterType('in')} className={`px-3 py-1 text-xs font-bold rounded ${filterType === 'in' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}>In</button>
                            <button onClick={() => setFilterType('out')} className={`px-3 py-1 text-xs font-bold rounded ${filterType === 'out' ? 'bg-rose-50 text-rose-600' : 'text-slate-500'}`}>Out</button>
                        </div>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="flex-1 overflow-hidden px-6 pb-6 mt-2">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#fcfdfe] dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight border-r border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center justify-between">Type <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight border-r border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center justify-between">Name <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight border-r border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center justify-between">Date <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight text-right w-48">
                                            <div className="flex items-center justify-between">Amount <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredLedger.map((item, idx) => (
                                        <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdfe]'} dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group`}>
                                            <td className="px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 border-r border-slate-50 dark:border-slate-800">
                                                {item.type}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 border-r border-slate-50 dark:border-slate-800">
                                                {item.name}
                                                {item.description && item.description !== item.name && (
                                                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{item.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-[13px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-50 dark:border-slate-800">
                                                {item.date}
                                            </td>
                                            <td className={`px-4 py-4 text-right text-sm font-black tabular-nums ${item.mode === 'in' ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                                                Rs {item.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLedger.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-slate-400 italic text-sm">
                                                No transactions found in this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
