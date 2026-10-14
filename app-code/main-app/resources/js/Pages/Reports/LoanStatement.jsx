import React from 'react';
import { Landmark } from 'lucide-react';
import { ReportShell, ReportKpis, ReportSection, ReportTable } from '@/Components/Reports/ReportKit';

export default function LoanStatement({ loans = [] }) {
    const list = Array.isArray(loans) ? loans : [];
    return (
        <ReportShell title="Loan Statement" subtitle="Overview of all active loans and liabilities" activeKey="loan-statement">
            <ReportKpis items={[{ label: 'Loan Accounts', value: list.length, icon: Landmark, tone: 'brand' }]} />
            <ReportSection title="Loans" flush>
                <ReportTable
                    columns={[{ key: 'name', label: 'Loan', get: (l) => l.name || l.title || '' }]}
                    rows={list}
                    empty="No loan data available. You don't have any active loans or loan accounts recorded yet."
                    emptyIcon={Landmark}
                />
            </ReportSection>
        </ReportShell>
    );
}
