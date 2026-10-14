import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { BookOpen, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportTable, DateRangeFilter, FilterSelect } from '@/Components/Reports/ReportKit';
import { TrendChart } from '@/Components/Reports/ReportCharts';

export default function AccountLedger({ account, transactions = [], openingBalance = 0, filters = {}, accounts = [] }) {
    const { store } = usePage().props;

    const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : openingBalance;

    const go = (patch) => {
        router.get(route('store.reports.account-ledger', { store_slug: store.slug }), { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    const reportData = account ? [{ id: 'op', type: 'opening', balance: openingBalance }, ...transactions] : [];

    const balancePoints = transactions
        .filter((t) => t.date)
        .map((t) => ({ x: String(t.date).slice(0, 10), y: Number(t.balance) || 0 }));

    const columns = [
        { key: 'date', label: 'Date', render: (row) => row.type === 'opening'
            ? <span className="italic text-ink-muted">{filters.start_date || '-'}</span>
            : new Date(row.date).toLocaleDateString('en-PK') },
        { key: 'reference', label: 'Reference', render: (row) => <span className="font-mono text-xs text-ink-muted">{row.reference || '-'}</span> },
        { key: 'description', label: 'Description', render: (row) => row.type === 'opening'
            ? <span className="font-medium italic text-ink-muted">Opening Balance</span>
            : <span className="text-ink-secondary">{row.description}</span> },
        { key: 'debit', label: 'Debit', align: 'right', render: (row) => (row.debit > 0 ? formatCurrency(row.debit, store) : '-') },
        { key: 'credit', label: 'Credit', align: 'right', render: (row) => (row.credit > 0 ? formatCurrency(row.credit, store) : '-') },
        { key: 'balance', label: 'Balance', align: 'right', render: (row) => <span className="font-bold tabular-nums text-ink-secondary">{formatCurrency(row.balance, store)}</span> },
    ];

    const filterNode = (
        <>
            <FilterSelect
                label="Account"
                value={filters.account_id}
                onChange={(v) => go({ account_id: v })}
                options={[{ value: '', label: 'Select account...' }, ...accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }))]}
            />
            <DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => go({ start_date: from, end_date: to })} />
        </>
    );

    return (
        <ReportShell
            title={account ? `${account.name} Ledger` : 'Account Ledger'}
            activeKey="account-ledger"
            filters={filterNode}
            exportConfig={account ? {
                filename: 'account-ledger',
                columns: [
                    { label: 'Date', get: (r) => (r.type === 'opening' ? filters.start_date || '' : r.date) },
                    { label: 'Reference', get: (r) => r.reference },
                    { label: 'Description', get: (r) => (r.type === 'opening' ? 'Opening Balance' : r.description) },
                    { label: 'Debit', get: (r) => r.debit },
                    { label: 'Credit', get: (r) => r.credit },
                    { label: 'Balance', get: (r) => r.balance },
                ],
                rows: reportData,
            } : undefined}
        >
            {!account ? (
                <ReportSection>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-muted"><BookOpen size={22} /></span>
                        <h3 className="text-base font-bold text-ink">Select an account</h3>
                        <p className="max-w-md text-sm text-ink-muted">Choose an account in the filters above to see its general ledger entries.</p>
                    </div>
                </ReportSection>
            ) : (
                <>
                    <ReportKpis items={[
                        { label: 'Opening Balance', value: formatCurrency(openingBalance, store), icon: BookOpen, tone: 'slate' },
                        { label: 'Total Debits', value: formatCurrency(totalDebit, store), icon: ArrowLeft, tone: 'sky' },
                        { label: 'Total Credits', value: formatCurrency(totalCredit, store), icon: ArrowRight, tone: 'violet' },
                        { label: 'Closing Balance', value: formatCurrency(closingBalance, store), icon: CreditCard, tone: 'brand' },
                    ]} />
                    <ReportSection title="Running balance">
                        <TrendChart points={balancePoints} label="Balance" type="area" height={240} />
                    </ReportSection>
                    <ReportSection title="Ledger entries" subtitle={`${transactions.length} entries`} flush>
                        <ReportTable columns={columns} rows={reportData} rowKey={(r, i) => r.id ?? i} />
                    </ReportSection>
                </>
            )}
        </ReportShell>
    );
}
