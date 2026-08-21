import React, { useState, useMemo } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
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

export default function CashHistory({ balance, ledger, store }) {
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

            <div className="flex flex-col h-full bg-sunken dark:bg-app overflow-hidden">
                
                {/* Top Toolbar (Similar to screenshot) */}
                <div className="bg-surface border-b border-line px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href={route('store.funds.index', { store_slug: store.slug })} className="text-ink-muted hover:text-ink-secondary">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-ink">Cash In Hand</h1>
                            <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm">
                                {getCurrencySymbol()} {balance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg">
                            <Printer size={18} />
                        </button>
                        <button className="px-4 py-2 bg-[#d11124] text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition-colors">
                            Adjust Cash
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                    <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider">Transactions</h2>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                            <input 
                                type="text"
                                placeholder="Search Transactions"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div className="flex bg-surface border border-line p-1 rounded-lg">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-xs font-bold rounded ${filterType === 'all' ? 'bg-sunken text-brand-600' : 'text-ink-muted'}`}>All</button>
                            <button onClick={() => setFilterType('in')} className={`px-3 py-1 text-xs font-bold rounded ${filterType === 'in' ? 'bg-emerald-50 text-emerald-600' : 'text-ink-muted'}`}>In</button>
                            <button onClick={() => setFilterType('out')} className={`px-3 py-1 text-xs font-bold rounded ${filterType === 'out' ? 'bg-rose-50 text-rose-600' : 'text-ink-muted'}`}>Out</button>
                        </div>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="flex-1 overflow-hidden px-6 pb-6 mt-2">
                    <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-sunken dark:bg-surface border-b border-line">
                                    <tr>
                                        <th className="px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight border-r border-line">
                                            <div className="flex items-center justify-between">Type <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight border-r border-line">
                                            <div className="flex items-center justify-between">Name <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight border-r border-line">
                                            <div className="flex items-center justify-between">Date <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight text-right w-48">
                                            <div className="flex items-center justify-between">Amount <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filteredLedger.map((item, idx) => (
                                        <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sunken'} dark:bg-app hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group`}>
                                            <td className="px-4 py-4 text-sm font-bold text-ink-secondary dark:text-ink border-r border-line">
                                                {item.type}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-ink-secondary border-r border-line">
                                                {item.name}
                                                {item.description && item.description !== item.name && (
                                                    <p className="text-2xs text-ink-muted font-normal mt-0.5 line-clamp-1">{item.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-[13px] font-medium text-ink-muted border-r border-line">
                                                {item.date}
                                            </td>
                                            <td className={`px-4 py-4 text-right text-sm font-bold tabular-nums ${item.mode === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {getCurrencySymbol()} {item.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="p-1 text-neutral-300 hover:text-ink-secondary dark:hover:text-neutral-200">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLedger.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-ink-muted italic text-sm">
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
