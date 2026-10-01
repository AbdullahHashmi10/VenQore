import React from 'react';
import ReportPage from './Components/ReportPage';
import { PieChart } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function ExpenseByCategory({ expenses }) {
    const { store } = usePage().props;
    const total = expenses.reduce((sum, exp) => sum + exp.total, 0);

    return (
        <ReportPage
            title="Expense by Category"
            subtitle="Breakdown of expenses across different categories"
            icon={PieChart}
        >
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-ink-muted uppercase tracking-widest">Category Breakdown</h4>
                        <div className="space-y-3">
                            {expenses.map((exp, idx) => {
                                const percentage = total > 0 ? (exp.total / total) * 100 : 0;
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-ink">{exp.category || 'Uncategorized'}</span>
                                            <span className="text-ink-muted">{formatCurrency(exp.total, store)} ({percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-sunken h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-brand-500 h-full transition-all duration-slower"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-app rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-4 shadow-xl ">
                            <PieChart size={40} />
                        </div>
                        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Total Expenses</p>
                        <p className="text-4xl font-bold text-ink">{formatCurrency(total, store)}</p>
                    </div>
                </div>
            </div>
        </ReportPage>
    );
}
