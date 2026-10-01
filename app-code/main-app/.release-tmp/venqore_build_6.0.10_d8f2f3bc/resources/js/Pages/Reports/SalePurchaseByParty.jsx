import React from 'react';
import ReportPage from './Components/ReportPage';
import { ArrowLeftRight } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function SalePurchaseByParty({ parties }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Sale & Purchase by Party"
            subtitle="Net transaction summary for each customer and supplier"
            icon={ArrowLeftRight}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Party Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Sales</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Purchases</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Net Position</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {parties.map((party, idx) => (
                            <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <td className="px-6 py-4 font-bold text-ink">{party.name}</td>
                                <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(party.sales)}</td>
                                <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">{formatCurrency(party.purchases)}</td>
                                <td className={`px-6 py-4 text-right text-sm font-bold ${party.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(party.net)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
