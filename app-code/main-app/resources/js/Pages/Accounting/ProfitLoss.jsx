import React from 'react';
import { usePage } from '@inertiajs/react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars, TrendChart } from '@/Components/Reports/ReportCharts';

function AccountsTable({ title, icon, tone, accounts = [], total, totalClass }) {
    return (
        <ReportSection title={title} icon={icon} tone={tone} flush>
            <ReportTable
                columns={[
                    { key: 'name', label: 'Account', render: (a) => <span className="font-bold text-ink-secondary">{a.name}</span> },
                    { key: 'balance', label: 'Amount', align: 'right', get: (a) => parseFloat(a.balance) || 0, render: (a) => <span className="font-bold tabular-nums text-ink">{formatCurrency(parseFloat(a.balance) || 0)}</span> },
                ]}
                rows={accounts}
                rowKey={(a, i) => a.id ?? i}
                totals={{ name: `Total ${title}`, balance: <span className={totalClass}>{formatCurrency(total)}</span> }}
                pageSize={0}
            />
        </ReportSection>
    );
}

export default function ProfitLoss({ incomeAccounts = [], expenseAccounts = [], totalIncome = 0, totalExpense = 0, netProfit = 0 }) {
    usePage();
    const rank = (list) => list
        .map((a) => ({ label: a.name, value: Math.abs(parseFloat(a.balance) || 0) }))
        .filter((a) => a.value > 0)
        .sort((a, b) => b.value - a.value);
    const incomeRank = rank(incomeAccounts);
    const expenseRank = rank(expenseAccounts);

    return (
        <ReportShell
            title="Profit & Loss"
            subtitle="Income and expenses summary"
            activeKey="profit-loss"
            exportConfig={{
                filename: 'profit-and-loss',
                columns: [
                    { label: 'Section', get: (r) => r.section },
                    { label: 'Account', get: (r) => r.name },
                    { label: 'Amount', get: (r) => r.balance },
                ],
                rows: [
                    ...incomeAccounts.map((a) => ({ section: 'Income', ...a })),
                    ...expenseAccounts.map((a) => ({ section: 'Expense', ...a })),
                ],
            }}
        >
            <ReportKpis items={[
                { label: 'Net Profit', value: formatCurrency(netProfit), icon: netProfit >= 0 ? TrendingUp : TrendingDown, tone: netProfit >= 0 ? 'emerald' : 'rose', valueTone: netProfit >= 0 ? 'emerald' : 'rose', trend: netProfit >= 0 ? 'up' : 'down' },
                { label: 'Total Income', value: formatCurrency(totalIncome), icon: TrendingUp, tone: 'emerald' },
                { label: 'Total Expenses', value: formatCurrency(totalExpense), icon: TrendingDown, tone: 'rose' },
                { label: 'Margin', value: totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : '-', icon: Wallet, tone: 'brand' },
            ]} />

            <ReportGrid>
                <ReportCol span={4}>
                    <ReportSection title="Income vs expenses">
                        <TrendChart
                            series={[{ name: 'Amount', points: [{ x: 'Income', y: Number(totalIncome) || 0 }, { x: 'Expenses', y: Number(totalExpense) || 0 }] }]}
                            type="bar" height={240} legend={false}
                        />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Income sources">
                        <DonutChart slices={incomeRank.map((r) => ({ name: r.label, value: r.value }))} height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Top expenses">
                        <RankBars items={expenseRank} limit={5} colorIndex={1} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={6}>
                    <AccountsTable title="Income" icon={TrendingUp} tone="emerald" accounts={incomeAccounts} total={totalIncome} totalClass="text-emerald-600" />
                </ReportCol>
                <ReportCol span={6}>
                    <AccountsTable title="Expenses" icon={TrendingDown} tone="rose" accounts={expenseAccounts} total={totalExpense} totalClass="text-rose-600" />
                </ReportCol>
            </ReportGrid>
        </ReportShell>
    );
}
