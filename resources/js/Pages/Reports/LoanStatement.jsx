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
                <div className="w-20 h-20 rounded-2xl bg-app flex items-center justify-center mx-auto mb-6">
                    <Landmark size={40} className="text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">No Loan Data Available</h3>
                <p className="text-ink-muted max-w-sm mx-auto">You don't have any active loans or loan accounts recorded in the system yet.</p>
            </div>
        </ReportPage>
    );
}
