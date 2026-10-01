import React from 'react';
import ReportPage from './Components/ReportPage';
import { BarChart3 } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function ItemCategoryWiseProfitLoss({ categories }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Category-wise Profit & Loss"
            subtitle="Profitability analysis grouped by product categories"
            icon={BarChart3}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Revenue</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Cost</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Profit</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {categories.map((cat, idx) => {
                            const margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
                            return (
                                <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                    <td className="px-6 py-4 font-bold text-ink">{cat.name}</td>
                                    <td className="px-6 py-4 text-right text-sm text-ink-secondary">{formatCurrency(cat.revenue)}</td>
                                    <td className="px-6 py-4 text-right text-sm text-ink-secondary">{formatCurrency(cat.cost)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(cat.profit)}</td>
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
