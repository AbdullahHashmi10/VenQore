import React from 'react';
import ReportPage from './Components/ReportPage';
import { Tag } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function ItemWiseDiscount({ items }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Item-wise Discount Report"
            subtitle="Total discounts given on each product"
            icon={Tag}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Discount Given</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{item.product?.name || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{item.product?.sku || 'N/A'}</td>
                                <td className="px-6 py-4 text-right text-sm font-black text-red-600 dark:text-red-400">{formatCurrency(item.total_discount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
