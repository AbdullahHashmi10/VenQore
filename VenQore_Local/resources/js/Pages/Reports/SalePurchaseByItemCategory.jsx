import React from 'react';
import ReportPage from './Components/ReportPage';
import { Tags } from 'lucide-react';

export default function SalePurchaseByItemCategory({ categories }) {
    return (
        <ReportPage
            title="Sale & Purchase by Category"
            subtitle="Transaction summary grouped by product categories"
            icon={Tags}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sales</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Purchases</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categories.map((cat, idx) => {
                            const sales = cat.products.reduce((sum, p) => sum + p.sale_items_sum_subtotal, 0);
                            const purchases = cat.products.reduce((sum, p) => sum + p.purchase_items_sum_subtotal, 0);
                            return (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{cat.name}</td>
                                    <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">Rs {sales.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">Rs {purchases.toLocaleString()}</td>
                                    <td className={`px-6 py-4 text-right text-sm font-black ${sales - purchases >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        Rs {(sales - purchases).toLocaleString()}
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
