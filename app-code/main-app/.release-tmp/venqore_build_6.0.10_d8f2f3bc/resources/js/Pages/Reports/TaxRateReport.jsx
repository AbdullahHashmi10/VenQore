import React from 'react';
import ReportPage from './Components/ReportPage';
import { Hash } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function TaxRateReport({ taxRates }) {
    const { store } = usePage().props;
    const totalTax = taxRates.reduce((sum, tr) => sum + tr.total_tax, 0);

    return (
        <ReportPage
            title="Tax Rate Report"
            subtitle="Breakdown of tax collected by different tax rates"
            icon={Hash}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Tax Rate (%)</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-center">Invoice Count</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Tax Collected</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {taxRates.map((tr, idx) => {
                            const share = totalTax > 0 ? (tr.total_tax / totalTax) * 100 : 0;
                            return (
                                <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                    <td className="px-6 py-4 font-bold text-ink">{tr.tax_rate}%</td>
                                    <td className="px-6 py-4 text-center text-sm text-ink-muted">{tr.count}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-brand-600 dark:text-brand-400">{formatCurrency(tr.total_tax)}</td>
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
                    <tfoot>
                        <tr className="bg-app font-bold">
                            <td colSpan="2" className="px-6 py-4 text-sm text-ink uppercase tracking-wider">Total Tax</td>
                            <td className="px-6 py-4 text-right text-brand-600 dark:text-brand-400">{formatCurrency(totalTax)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </ReportPage>
    );
}
