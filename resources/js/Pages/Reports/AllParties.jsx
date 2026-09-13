import React from 'react';
import ReportPage from './Components/ReportPage';
import { Users } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function AllParties({ parties }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="All Parties Report"
            subtitle="Complete list of customers and suppliers"
            icon={Users}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {parties.map((party) => (
                            <tr key={party.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-ink">{party.name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-2xs font-bold uppercase ${party.type === 'customer'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {party.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-ink-secondary">{party.phone || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-ink-secondary">{party.email || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm font-bold text-ink">
                                    {formatCurrency(party.balance || 0, store)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
