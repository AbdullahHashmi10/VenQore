import React from 'react';
import ReportPage from './Components/ReportPage';
import { UserCheck } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function PartyWiseProfitLoss({ parties }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Party-wise Profit & Loss"
            subtitle="Profitability analysis per customer/supplier"
            icon={UserCheck}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Party Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Sales</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Estimated Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {parties.map((party, idx) => (
                            <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <td className="px-6 py-4 font-bold text-ink">{party.name}</td>
                                <td className="px-6 py-4 text-right text-sm text-ink-secondary">{formatCurrency(party.sales)}</td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(party.profit)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
