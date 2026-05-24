import React from 'react';
import ReportPage from './Components/ReportPage';
import { RefreshCw } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function CashFlow({ operating, investing, financing }) {
    const { store } = usePage().props;
    const netCashFlow = operating + investing + financing;

    return (
        <ReportPage
            title="Cash Flow Statement"
            subtitle="Analysis of cash movement in the business"
            icon={RefreshCw}
        >
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Operating Activities</p>
                        <p className="text-2xl font-black text-emerald-900 dark:text-white">{formatCurrency(operating, store)}</p>
                    </div>
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Investing Activities</p>
                        <p className="text-2xl font-black text-blue-900 dark:text-white">{formatCurrency(investing, store)}</p>
                    </div>
                    <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Financing Activities</p>
                        <p className="text-2xl font-black text-purple-900 dark:text-white">{formatCurrency(financing, store)}</p>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-3xl flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-1">Net Cash Flow</h3>
                        <p className="text-4xl font-black text-white">{formatCurrency(netCashFlow, store)}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${netCashFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        <RefreshCw size={32} className="text-white" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Summary Breakdown</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-slate-600 dark:text-slate-400">Cash at Beginning of Period</span>
                            <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(0, store)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-slate-600 dark:text-slate-400">Net Increase/Decrease in Cash</span>
                            <span className={`font-bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netCashFlow, store)}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-indigo-600 text-white rounded-xl font-bold">
                            <span>Cash at End of Period</span>
                            <span>{formatCurrency(netCashFlow, store)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </ReportPage>
    );
}
