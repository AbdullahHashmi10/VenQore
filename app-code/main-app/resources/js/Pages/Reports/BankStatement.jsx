import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportTable, DateRangeFilter, FilterSelect } from '@/Components/Reports/ReportKit';
import { TrendChart } from '@/Components/Reports/ReportCharts';

const day = (d) => String(d || '').slice(0, 10);

export default function BankStatement({ transactions = [], stats = {}, filters = {}, bank_accounts = [] }) {
    const { store } = usePage().props;

    const go = (patch) => {
        router.get(route('store.reports.bank-statement', { store_slug: store.slug }), { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    // Deposits vs withdrawals per day
    const perDay = {};
    transactions.forEach((t) => {
        const k = day(t.date);
        if (!k) return;
        perDay[k] = perDay[k] || { in: 0, out: 0 };
        if (t.type === 'credit') perDay[k].in += Number(t.amount) || 0; else perDay[k].out += Number(t.amount) || 0;
    });
    const days = Object.keys(perDay).sort();
    const series = [
        { name: 'Deposits', points: days.map((d) => ({ x: d, y: perDay[d].in })) },
        { name: 'Withdrawals', points: days.map((d) => ({ x: d, y: perDay[d].out })) },
    ];

    const columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'reference', label: 'Reference', render: (row) => <span className="font-mono text-xs text-ink-muted">{row.reference}</span> },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type', sortable: true, render: (row) => (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.type === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                {row.type === 'credit' ? 'Deposit' : 'Withdrawal'}
            </span>
        ) },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (row) => (
            <span className={`font-bold tabular-nums ${row.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(row.amount, store)}</span>
        ) },
        { key: 'balance', label: 'Balance', align: 'right', render: (row) => <span className="font-medium tabular-nums text-ink-secondary">{formatCurrency(row.balance, store)}</span> },
    ];

    const filterNode = (
        <>
            <FilterSelect
                label="Bank account"
                value={filters.bank_account_id}
                onChange={(v) => go({ bank_account_id: v })}
                options={[{ value: '', label: 'All accounts' }, ...bank_accounts.map((b) => ({ value: b.id, label: `${b.bank_name} - ${b.account_number}` }))]}
            />
            <DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => go({ start_date: from, end_date: to })} />
        </>
    );

    return (
        <ReportShell
            title="Bank Statement"
            subtitle={filters.start_date ? `${filters.start_date} to ${filters.end_date || ''}` : undefined}
            activeKey="bank-statement"
            filters={filterNode}
            exportConfig={{
                filename: 'bank-statement',
                columns: [
                    { label: 'Date', get: (r) => r.date },
                    { label: 'Reference', get: (r) => r.reference },
                    { label: 'Description', get: (r) => r.description },
                    { label: 'Type', get: (r) => (r.type === 'credit' ? 'Deposit' : 'Withdrawal') },
                    { label: 'Amount', get: (r) => r.amount },
                    { label: 'Balance', get: (r) => r.balance },
                ],
                rows: transactions,
            }}
        >
            <ReportKpis items={[
                { label: 'Opening Balance', value: formatCurrency(stats.opening_balance, store), icon: Wallet, tone: 'slate' },
                { label: 'Total Deposits', value: formatCurrency(stats.total_deposits, store), icon: ArrowDownLeft, tone: 'emerald', valueTone: 'emerald' },
                { label: 'Total Withdrawals', value: formatCurrency(stats.total_withdrawals, store), icon: ArrowUpRight, tone: 'rose', valueTone: 'rose' },
                { label: 'Closing Balance', value: formatCurrency(stats.closing_balance, store), icon: Landmark, tone: 'brand' },
            ]} />

            <ReportSection title="Deposits vs withdrawals" subtitle="Per day">
                <TrendChart series={series} type="bar" height={260} />
            </ReportSection>

            <ReportSection title="Transactions" subtitle={`${transactions.length} entries`} flush>
                <ReportTable columns={columns} rows={transactions} rowKey={(r, i) => r.id ?? i} empty="No bank transactions for this period" />
            </ReportSection>
        </ReportShell>
    );
}
