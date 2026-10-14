import React, { useState } from 'react';
import { Scale, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

export default function TrialBalance({
    accounts = [],
    totalDebits = 0,
    totalCredits = 0,
    isBalanced = true,
    asOf = '',
}) {
    const { store } = usePage().props;
    const [dateInput, setDateInput] = useState(asOf);

    if (!store?.slug) return null;

    // Apply date filter — re-fetches from the server
    const applyDate = () => {
        router.get(route('store.reports.trial-balance', { store_slug: store.slug }), { date: dateInput }, { preserveScroll: true });
    };

    const difference = totalDebits - totalCredits;

    const byType = {};
    accounts.forEach((a) => {
        const k = a.type || 'other';
        byType[k] = byType[k] || { debit: 0, credit: 0 };
        byType[k].debit += Number(a.debit) || 0;
        byType[k].credit += Number(a.credit) || 0;
    });
    const types = Object.keys(byType);
    const typeLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const typeSeries = [
        { name: 'Debit', points: types.map((t) => ({ x: typeLabel(t), y: byType[t].debit })) },
        { name: 'Credit', points: types.map((t) => ({ x: typeLabel(t), y: byType[t].credit })) },
    ];
    const topSlices = [...accounts]
        .map((a) => ({ name: a.name, value: Math.abs(Number(a.debit) || 0) + Math.abs(Number(a.credit) || 0) }))
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    const columns = [
        { key: 'code', label: 'Code', sortable: true, render: (row) => <span className="font-mono text-sm text-ink-muted">{row.code}</span> },
        { key: 'name', label: 'Account Name', sortable: true, render: (row) => <span className="font-medium text-ink">{row.name}</span> },
        { key: 'type', label: 'Type', sortable: true, render: (row) => (
            <span className="rounded-full bg-sunken px-2 py-0.5 text-xs capitalize text-ink-secondary">{row.type}</span>
        ) },
        { key: 'debit', label: 'Debit', align: 'right', sortable: true, render: (row) => (
            <span className="font-bold tabular-nums text-ink">{row.debit > 0 ? formatCurrency(row.debit) : '—'}</span>
        ) },
        { key: 'credit', label: 'Credit', align: 'right', sortable: true, render: (row) => (
            <span className="font-bold tabular-nums text-ink">{row.credit > 0 ? formatCurrency(row.credit) : '—'}</span>
        ) },
        { key: 'net', label: 'Net (Dr − Cr)', align: 'right', sortable: true, get: (row) => row.net ?? (row.debit - row.credit), render: (row) => {
            const net = row.net ?? (row.debit - row.credit);
            const positive = net >= 0;
            return (
                <span className={`font-semibold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {positive ? '' : '−'}{formatCurrency(Math.abs(net))}
                </span>
            );
        } },
    ];

    const filters = (
        <label className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">As of</span>
            <input
                type="date"
                value={dateInput}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDateInput(e.target.value)}
                onBlur={applyDate}
                onKeyDown={(e) => e.key === 'Enter' && applyDate()}
                className={filterInputCls}
            />
        </label>
    );

    return (
        <ReportShell
            title="Trial Balance"
            subtitle={asOf ? `As of ${asOf}` : undefined}
            activeKey="trial-balance"
            filters={filters}
            exportConfig={{
                filename: 'trial-balance',
                columns: [
                    { label: 'Code', get: (r) => r.code },
                    { label: 'Account', get: (r) => r.name },
                    { label: 'Type', get: (r) => r.type },
                    { label: 'Debit', get: (r) => r.debit },
                    { label: 'Credit', get: (r) => r.credit },
                    { label: 'Net', get: (r) => r.net ?? (r.debit - r.credit) },
                ],
                rows: accounts,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Debits', value: formatCurrency(totalDebits), icon: ArrowDownLeft, tone: 'sky' },
                { label: 'Total Credits', value: formatCurrency(totalCredits), icon: ArrowUpRight, tone: 'violet' },
                { label: 'Difference', value: formatCurrency(Math.abs(difference)), icon: Scale, tone: isBalanced ? 'emerald' : 'rose', valueTone: isBalanced ? 'emerald' : 'rose', sub: isBalanced ? 'Balanced' : 'Unbalanced' },
                { label: 'Accounts', value: String(accounts.length), icon: isBalanced ? CheckCircle2 : AlertTriangle, tone: isBalanced ? 'emerald' : 'rose', sub: isBalanced ? 'Ledger is balanced' : 'Investigate immediately' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Debit vs credit by account type">
                        <TrendChart series={typeSeries} type="bar" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Biggest accounts" subtitle="By total activity">
                        <DonutChart slices={topSlices} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Accounts" subtitle={`${accounts.length} accounts`} flush>
                <ReportTable
                    columns={columns}
                    rows={accounts}
                    rowKey={(r, i) => r.id ?? r.code ?? i}
                    totals={{ debit: formatCurrency(totalDebits), credit: formatCurrency(totalCredits), net: formatCurrency(Math.abs(difference)) }}
                    pageSize={100}
                />
            </ReportSection>
        </ReportShell>
    );
}
