import React from 'react';
import ReportPage from './Components/ReportPage';
import { List } from 'lucide-react';

export default function ExpenseByItem({ expenses }) {
    return (
        <ReportPage
            title="Expense by Item"
            subtitle="Detailed list of all individual expenses"
            icon={List}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">{exp.reference || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                        {exp.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{exp.description || 'No description'}</td>
                                <td className="px-6 py-4 text-right text-sm font-black text-red-600 dark:text-red-400">Rs {exp.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
