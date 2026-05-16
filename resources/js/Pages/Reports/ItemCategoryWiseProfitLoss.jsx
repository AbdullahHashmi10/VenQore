import React from 'react';
import ReportPage from './Components/ReportPage';
import { BarChart3 } from 'lucide-react';

export default function ItemCategoryWiseProfitLoss({ categories }) {
    return (
        <ReportPage
            title="Category-wise Profit & Loss"
            subtitle="Profitability analysis grouped by product categories"
            icon={BarChart3}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cost</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Profit</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categories.map((cat, idx) => {
                            const margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
                            return (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{cat.name}</td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">Rs {cat.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">Rs {cat.cost.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">Rs {cat.profit.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${margin > 20 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {margin.toFixed(1)}%
                                        </span>
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
