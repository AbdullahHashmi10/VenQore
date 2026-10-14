import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Users, CreditCard, ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import WhatsAppShareModal from '@/Components/WhatsAppShareModal';
import { ReportShell, ReportKpis, ReportSection, ReportTable, DateRangeFilter, FilterSelect } from '@/Components/Reports/ReportKit';
import { TrendChart } from '@/Components/Reports/ReportCharts';

export default function PartyStatement({ party, transactions = [], openingBalance = 0, filters = {}, parties = [] }) {
    const { store } = usePage().props;
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

    const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    // Positive balance = receivable (Dr), negative = payable (Cr)
    const closingBalance = openingBalance + totalDebit - totalCredit;

    let runningBalance = openingBalance;
    const dataWithBalance = transactions.map((t) => {
        runningBalance = runningBalance + (Number(t.debit) || 0) - (Number(t.credit) || 0);
        return { ...t, balance: runningBalance };
    });

    const go = (patch) => {
        router.get(route('store.reports.party-statement', { store_slug: store.slug }), { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    const balancePoints = dataWithBalance.filter((t) => t.date).map((t) => ({ x: String(t.date).slice(0, 10), y: t.balance }));

    const columns = [
        { key: 'date', label: 'Date', sortable: true, render: (row) => new Date(row.date).toLocaleDateString('en-PK') },
        { key: 'type', label: 'Type', render: (row) => <span className="font-medium text-ink-secondary">{row.type}</span> },
        { key: 'ref', label: 'Reference', render: (row) => <span className="font-mono text-xs text-ink-muted">{row.ref}</span> },
        { key: 'debit', label: 'Debit', align: 'right', render: (row) => (row.debit > 0 ? <span className="font-bold tabular-nums text-ink-secondary">{formatCurrency(row.debit)}</span> : '-') },
        { key: 'credit', label: 'Credit', align: 'right', render: (row) => (row.credit > 0 ? <span className="font-bold tabular-nums text-ink-secondary">{formatCurrency(row.credit)}</span> : '-') },
        { key: 'balance', label: 'Balance', align: 'right', render: (row) => {
            const isNegative = row.balance < 0;
            return (
                <span className={`font-bold tabular-nums ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(Math.abs(row.balance))} {isNegative ? 'Cr' : 'Dr'}
                </span>
            );
        } },
    ];

    const filterNode = (
        <>
            <FilterSelect
                label="Party"
                value={filters.party_id}
                onChange={(v) => go({ party_id: v })}
                options={[{ value: '', label: 'Select party...' }, ...parties.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => go({ start_date: from, end_date: to })} />
        </>
    );

    const whatsapp = party ? (
        <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="flex h-10 items-center gap-2 rounded-[12px] bg-emerald-600 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
            <MessageCircle size={16} /><span className="hidden sm:inline">Share on WhatsApp</span>
        </button>
    ) : null;

    return (
        <ReportShell
            title={party ? `Statement: ${party.name}` : 'Party Statement'}
            activeKey="party-statement"
            filters={filterNode}
            actions={whatsapp}
            exportConfig={party ? {
                filename: 'party-statement',
                columns: [
                    { label: 'Date', get: (r) => r.date },
                    { label: 'Type', get: (r) => r.type },
                    { label: 'Reference', get: (r) => r.ref },
                    { label: 'Debit', get: (r) => r.debit },
                    { label: 'Credit', get: (r) => r.credit },
                    { label: 'Balance', get: (r) => r.balance },
                ],
                rows: dataWithBalance,
            } : undefined}
        >
            {!party ? (
                <ReportSection>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500"><Users size={22} /></span>
                        <h3 className="text-base font-bold text-ink">Select a party</h3>
                        <p className="max-w-md text-sm text-ink-muted">Choose a customer or supplier in the filters above to generate their ledger statement.</p>
                    </div>
                </ReportSection>
            ) : (
                <>
                    <ReportKpis items={[
                        { label: 'Opening Balance', value: formatCurrency(Math.abs(openingBalance)), icon: ArrowRight, tone: 'slate', sub: openingBalance >= 0 ? 'Receivable (Dr)' : 'Payable (Cr)' },
                        { label: 'Total Debits', value: formatCurrency(totalDebit), icon: ArrowLeft, tone: 'sky' },
                        { label: 'Total Credits', value: formatCurrency(totalCredit), icon: ArrowRight, tone: 'violet' },
                        { label: 'Closing Balance', value: formatCurrency(Math.abs(closingBalance)), icon: CreditCard, tone: closingBalance > 0 ? 'emerald' : 'rose', valueTone: closingBalance > 0 ? 'emerald' : 'rose', sub: closingBalance >= 0 ? 'Receivable (Dr)' : 'Payable (Cr)' },
                    ]} />
                    <ReportSection title="Balance over time">
                        <TrendChart points={balancePoints} label="Balance" type="area" height={240} />
                    </ReportSection>
                    <ReportSection title="Statement" subtitle={`${transactions.length} entries`} flush>
                        <ReportTable columns={columns} rows={dataWithBalance} rowKey={(r, i) => r.id ?? `${r.ref}-${i}`} />
                    </ReportSection>
                </>
            )}

            {party && (
                <WhatsAppShareModal
                    isOpen={showWhatsAppModal}
                    onClose={() => setShowWhatsAppModal(false)}
                    documentType="party_statement"
                    documentId={party?.id}
                    partyName={party?.name}
                    initialPhone={party?.phone}
                    documentNumber={`Statement: ${party?.name || ''}`}
                    amount={Math.abs(closingBalance || 0)}
                />
            )}
        </ReportShell>
    );
}
