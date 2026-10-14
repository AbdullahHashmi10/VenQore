import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, Landmark, Scale } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

function AccountsSection({ title, icon, tone, accounts = [], total, totalClass }) {
    return (
        <ReportSection title={title} icon={icon} tone={tone} flush>
            <ReportTable
                columns={[
                    { key: 'code', label: 'Code', width: 90, render: (a) => <span className="font-mono text-xs text-ink-muted">{a.code}</span> },
                    { key: 'name', label: 'Account', render: (a) => <span className="font-medium text-ink-secondary">{a.name}</span> },
                    { key: 'balance', label: 'Balance', align: 'right', get: (a) => Number(a.balance) || 0, render: (a) => <span className="font-bold tabular-nums text-ink">{formatCurrency(a.balance)}</span> },
                ]}
                rows={accounts}
                rowKey={(a, i) => a.id ?? i}
                totals={{ name: `Total ${title}`, balance: <span className={totalClass}>{formatCurrency(total)}</span> }}
                pageSize={0}
                empty="No activity as of this date."
            />
        </ReportSection>
    );
}

export default function BalanceSheet({
    assets = { accounts: [], total: 0 },
    liabilities = { accounts: [], total: 0 },
    equity = { accounts: [], total: 0 },
    total_assets = 0,
    total_liabilities = 0,
    total_equity = 0,
    is_balanced = true,
    as_of = '',
}) {
    const { store } = usePage().props;
    const [dateInput, setDateInput] = useState(as_of);
    const equationDiff = Math.abs(total_assets - (total_liabilities + total_equity));

    const applyDate = () => router.get(route('store.accounting.balance-sheet', { store_slug: store.slug }), { date: dateInput }, { preserveScroll: true });

    const filters = (
        <label className="flex items-center gap-2" title="As-of date: all balances computed up to and including this date">
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

    const exportRows = [
        ...assets.accounts.map((a) => ({ section: 'Assets', ...a })),
        ...liabilities.accounts.map((a) => ({ section: 'Liabilities', ...a })),
        ...equity.accounts.map((a) => ({ section: 'Equity', ...a })),
    ];

    const topAssets = [...assets.accounts]
        .map((a) => ({ label: a.name, value: Math.abs(Number(a.balance) || 0), sub: a.code }))
        .filter((a) => a.value > 0)
        .sort((a, b) => b.value - a.value);

    return (
        <ReportShell
            title="Balance Sheet"
            subtitle={as_of ? `Financial position as of ${as_of}` : undefined}
            activeKey="balance-sheet"
            filters={filters}
            exportConfig={{
                filename: 'balance-sheet',
                columns: [
                    { label: 'Section', get: (r) => r.section },
                    { label: 'Code', get: (r) => r.code },
                    { label: 'Account', get: (r) => r.name },
                    { label: 'Balance', get: (r) => r.balance },
                ],
                rows: exportRows,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Assets', value: formatCurrency(total_assets), icon: ShieldCheck, tone: 'blue' },
                { label: 'Total Liabilities', value: formatCurrency(total_liabilities), icon: Landmark, tone: 'rose' },
                { label: 'Total Equity', value: formatCurrency(total_equity), icon: TrendingUp, tone: 'brand' },
                { label: 'Books', value: is_balanced ? 'Balanced' : 'Unbalanced', icon: is_balanced ? CheckCircle2 : AlertTriangle, tone: is_balanced ? 'emerald' : 'rose', valueTone: is_balanced ? 'emerald' : 'rose', sub: is_balanced ? 'Assets = Liabilities + Equity' : `Difference ${formatCurrency(equationDiff)}` },
            ]} />

            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Funding structure" subtitle="Liabilities vs equity">
                        <DonutChart slices={[
                            { name: 'Liabilities', value: Math.abs(Number(total_liabilities) || 0) },
                            { name: 'Equity', value: Math.abs(Number(total_equity) || 0) },
                        ].filter((s) => s.value > 0)} height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Largest assets">
                        <RankBars items={topAssets} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={6}>
                    <AccountsSection title="Assets" icon={ShieldCheck} tone="blue" accounts={assets.accounts} total={total_assets} totalClass="text-blue-600" />
                </ReportCol>
                <ReportCol span={6} className="gap-2">
                    <AccountsSection title="Liabilities" icon={Landmark} tone="rose" accounts={liabilities.accounts} total={total_liabilities} totalClass="text-rose-600" />
                    <AccountsSection title="Equity" icon={Scale} tone="brand" accounts={equity.accounts} total={total_equity} totalClass="text-brand-600" />
                </ReportCol>
            </ReportGrid>
        </ReportShell>
    );
}
