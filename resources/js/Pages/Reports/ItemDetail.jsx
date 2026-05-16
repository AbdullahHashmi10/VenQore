import React from 'react';
import ReportPage from './Components/ReportPage';
import { Box } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function ItemDetail({ products }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Item Detail Report"
            subtitle="Comprehensive details of all products in inventory"
            icon={Box}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Avg FIFO Cost</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sale Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 dark:text-white">{product.name}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{product.sku || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                        {product.category?.name || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">{formatCurrency(product.avg_unit_cost ?? product.cost_price)}</td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(product.price)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${(product.fifo_qty ?? product.stock_quantity) > 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {product.fifo_qty ?? product.stock_quantity ?? 0}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
