import React from 'react';
import ReportPage from './Components/ReportPage';
import { Landmark } from 'lucide-react';

export default function LoanStatement({ loans }) {
    return (
        <ReportPage
            title="Loan Statement"
            subtitle="Overview of all active loans and liabilities"
            icon={Landmark}
        >
            <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                    <Landmark size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Loan Data Available</h3>
                <p className="text-slate-500 max-w-sm mx-auto">You don't have any active loans or loan accounts recorded in the system yet.</p>
            </div>
        </ReportPage>
    );
}
