import React from 'react';
import ReportPage from './Components/ReportPage';
import { Layers } from 'lucide-react';
import OfflineWarningBanner from '@/Components/OfflineWarningBanner';

export default function StockSummaryByCategory({ categories }) {
    const totalValue = categories.reduce((sum, cat) => sum + cat.value, 0);
    const totalProducts = categories.reduce((sum, cat) => sum + cat.products, 0);

    return (
        <ReportPage
            title="Stock Summary by Category"
            subtitle="Inventory valuation breakdown by product categories"
            icon={Layers}
            stats={
                <>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Categories</p>
                        <p className="text-lg font-black text-slate-800 dark:text-white">{categories.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Products</p>
                        <p className="text-lg font-black text-slate-800 dark:text-white">{totalProducts}</p>
                    </div>
                    <div className="col-span-2 bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-500/20">
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Total Inventory Value</p>
                        <p className="text-lg font-black text-white">Rs {totalValue.toLocaleString()}</p>
                    </div>
                </>
            }
        >
            <OfflineWarningBanner />
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Product Count</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Value (Retail)</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Value Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categories.map((cat, idx) => {
                            const share = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
                            return (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{cat.name}</td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{cat.products}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 dark:text-white">Rs {cat.value.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-indigo-500 h-full" style={{ width: `${share}% ` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{share.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
