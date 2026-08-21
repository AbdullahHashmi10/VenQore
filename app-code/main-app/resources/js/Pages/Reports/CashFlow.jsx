import React, { useState } from 'react';
import ReportPage from './Components/ReportPage';
import { RefreshCw, Calendar } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function CashFlow({ operating, investing, financing, filters = {} }) {
    const { store } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const netCashFlow = operating + investing + financing;

    const applyDateFilter = () => {
        router.get(route("store.reports.cash-flow", {
            store_slug: store.slug
        }), {
            start_date: startDate,
            end_date: endDate
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <ReportPage
            title="Cash Flow Statement"
            subtitle={`Analysis of cash movement in the business from ${filters.start_date || ''} to ${filters.end_date || ''}`}
            icon={RefreshCw}
        >
            {/* Interactive Date Filter Row */}
            <div className="p-6 border-b border-line bg-sunken/50 dark:bg-surface flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">Filter Cash Flow Period</span>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-surface border border-line px-3 py-1.5 rounded-xl shadow-sm">
                        <Calendar size={14} className="text-ink-muted" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-xs border-none outline-none text-ink-secondary dark:text-ink"
                        />
                        <span className="text-ink-muted text-xs font-bold px-1">TO</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-xs border-none outline-none text-ink-secondary dark:text-ink"
                        />
                    </div>
                    <button
                        onClick={applyDateFilter}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-all shadow-sm active:scale-95"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Operating Activities</p>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-white">{formatCurrency(operating, store)}</p>
                    </div>
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Investing Activities</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-white">{formatCurrency(investing, store)}</p>
                    </div>
                    <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Financing Activities</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-white">{formatCurrency(financing, store)}</p>
                    </div>
                </div>

                <div className="bg-neutral-900 text-white p-8 rounded-2xl flex justify-between items-center shadow-lg">
                    <div>
                        <h3 className="text-lg font-bold text-ink-muted uppercase tracking-widest mb-1">Net Cash Flow</h3>
                        <p className="text-4xl font-bold text-white">{formatCurrency(netCashFlow, store)}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${netCashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg`}>
                        <RefreshCw size={32} className="text-white" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-ink-muted uppercase tracking-widest">Summary Breakdown</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between p-4 bg-app rounded-xl">
                            <span className="text-ink-secondary">Cash at Beginning of Period</span>
                            <span className="font-bold text-ink">{formatCurrency(0, store)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-app rounded-xl">
                            <span className="text-ink-secondary">Net Increase/Decrease in Cash</span>
                            <span className={`font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netCashFlow, store)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-brand-600 text-white rounded-xl font-bold shadow-md">
                            <span>Cash at End of Period</span>
                            <span>{formatCurrency(netCashFlow, store)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </ReportPage>
    );
}
