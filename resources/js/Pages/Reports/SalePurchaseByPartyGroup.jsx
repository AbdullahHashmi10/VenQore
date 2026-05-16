import React from 'react';
import ReportPage from './Components/ReportPage';
import { Users2 } from 'lucide-react';

export default function SalePurchaseByPartyGroup({ groups }) {
    return (
        <ReportPage
            title="Sale & Purchase by Party Group"
            subtitle="Transaction summary grouped by party types (Customer/Supplier)"
            icon={Users2}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Party Group</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Party Count</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Sales</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Purchases</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net Position</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {groups.map((group, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">{group.group}</td>
                                <td className="px-6 py-4 text-center text-sm text-slate-500">{group.party_count}</td>
                                <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">Rs {group.sales.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">Rs {group.purchases.toLocaleString()}</td>
                                <td className={`px-6 py-4 text-right text-sm font-black ${group.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    Rs {group.net.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportPage>
    );
}
