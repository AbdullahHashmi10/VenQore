import React from 'react';
import ReportPage from './Components/ReportPage';
import { Layers } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import OfflineWarningBanner from '@/Components/OfflineWarningBanner';
import { formatCurrency } from '@/Utils/format';

export default function StockSummaryByCategory({ categories }) {
    const { store } = usePage().props;
    const totalValue = categories.reduce((sum, cat) => sum + cat.value, 0);
    const totalProducts = categories.reduce((sum, cat) => sum + cat.products, 0);

    return (
        <ReportPage
            title="Stock Summary by Category"
            subtitle="Inventory valuation breakdown by product categories"
            icon={Layers}
            stats={
                <>
                    <div className="bg-surface p-4 rounded-xl border border-line">
                        <p className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1">Total Categories</p>
                        <p className="text-lg font-bold text-ink">{categories.length}</p>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-line">
                        <p className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1">Total Products</p>
                        <p className="text-lg font-bold text-ink">{totalProducts}</p>
                    </div>
                    <div className="col-span-2 bg-brand-600 p-4 rounded-xl shadow-lg ">
                        <p className="text-2xs font-bold text-brand-100 uppercase tracking-widest mb-1">Total Inventory Value</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(totalValue)}</p>
                    </div>
                </>
            }
        >
            <OfflineWarningBanner />
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Category Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-center">Product Count</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Value (Retail)</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Value Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {categories.map((cat, idx) => {
                            const share = totalValue > 0 ? (cat.value / totalValue) * 100 : 0;
                            return (
                                <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                    <td className="px-6 py-4 font-bold text-ink">{cat.name}</td>
                                    <td className="px-6 py-4 text-center text-sm text-ink-secondary">{cat.products}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-ink">{formatCurrency(cat.value)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 bg-sunken h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-brand-500 h-full" style={{ width: `${share}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-ink-muted">{share.toFixed(1)}%</span>
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
