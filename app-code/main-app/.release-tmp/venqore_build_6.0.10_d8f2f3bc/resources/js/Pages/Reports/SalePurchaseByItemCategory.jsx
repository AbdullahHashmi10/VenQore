import React from 'react';
import ReportPage from './Components/ReportPage';
import { Tags } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function SalePurchaseByItemCategory({ categories }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Sale & Purchase by Category"
            subtitle="Transaction summary grouped by product categories"
            icon={Tags}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Sales</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Purchases</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Net</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {categories.map((cat, idx) => {
                            const sales = cat.products.reduce((sum, p) => sum + p.sale_items_sum_subtotal, 0);
                            const purchases = cat.products.reduce((sum, p) => sum + p.purchase_items_sum_subtotal, 0);
                            return (
                                <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                    <td className="px-6 py-4 font-bold text-ink">{cat.name}</td>
                                    <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(sales)}</td>
                                    <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">{formatCurrency(purchases)}</td>
                                    <td className={`px-6 py-4 text-right text-sm font-bold ${sales - purchases >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatCurrency(sales - purchases)}
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
