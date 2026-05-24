import React from 'react';
import ReportPage from './Components/ReportPage';
import { PieChart } from 'lucide-react';

export default function ExpenseByCategory({ expenses }) {
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
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Category Breakdown</h4>
                        <div className="space-y-3">
                            {expenses.map((exp, idx) => {
                                const percentage = total > 0 ? (exp.total / total) * 100 : 0;
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-800 dark:text-white">{exp.category || 'Uncategorized'}</span>
                                            <span className="text-slate-500">Rs {exp.total.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
                            <PieChart size={40} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">Rs {total.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </ReportPage>
    );
}
