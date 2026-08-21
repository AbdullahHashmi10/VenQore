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
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Discount Given</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <td className="px-6 py-4 font-bold text-ink">{item.product?.name || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-ink-muted">{item.product?.sku || 'N/A'}</td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(item.total_discount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
