import React from 'react';
import ReportPage from './Components/ReportPage';
import { List } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function ExpenseByItem({ expenses }) {
    const { store } = usePage().props;
    return (
        <ReportPage
            title="Expense by Item"
            subtitle="Detailed list of all individual expenses"
            icon={List}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-app border-b border-line">
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Reference</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <td className="px-6 py-4 text-sm text-ink-muted">{new Date(exp.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm font-bold text-ink">{exp.reference || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-lg bg-sunken text-2xs font-bold text-ink-secondary uppercase">
                                        {exp.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-ink-secondary">{exp.description || 'No description'}</td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(exp.amount, store)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
