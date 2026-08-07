import React from 'react';
import ReportPage from './Components/ReportPage';
import { Hash } from 'lucide-react';

export default function TaxRateReport({ taxRates }) {
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
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tax Rate (%)</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Invoice Count</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Tax Collected</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {taxRates.map((tr, idx) => {
                            const share = totalTax > 0 ? (tr.total_tax / totalTax) * 100 : 0;
                            return (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white">{tr.tax_rate}%</td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-500">{tr.count}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">Rs {tr.total_tax.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-indigo-500 h-full" style={{ width: `${share}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{share.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 font-black">
                            <td colSpan="2" className="px-6 py-4 text-sm text-slate-800 dark:text-white uppercase tracking-wider">Total Tax</td>
                            <td className="px-6 py-4 text-right text-indigo-600 dark:text-indigo-400">Rs {totalTax.toLocaleString()}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </ReportPage>
    );
}
