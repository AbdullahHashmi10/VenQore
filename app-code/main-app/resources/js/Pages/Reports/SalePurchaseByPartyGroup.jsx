import React from 'react';
import ReportPage from './Components/ReportPage';
import { Users2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function SalePurchaseByPartyGroup({ groups }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Sale & Purchase by Party Group"
            subtitle="Transaction summary grouped by party types (Customer/Supplier)"
            icon={Users2}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Party Group</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-center">Party Count</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Sales</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Total Purchases</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Net Position</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {groups.map((group, idx) => (
                            <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <td className="px-6 py-4 font-bold text-ink uppercase tracking-widest text-sm">{group.group}</td>
                                <td className="px-6 py-4 text-center text-sm text-ink-muted">{group.party_count}</td>
                                <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(group.sales)}</td>
                                <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">{formatCurrency(group.purchases)}</td>
                                <td className={`px-6 py-4 text-right text-sm font-bold ${group.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(group.net)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
