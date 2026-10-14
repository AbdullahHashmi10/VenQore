import React, { useState } from 'react';
import { RefreshCw, TrendingUp, Landmark, Wallet } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter } from '@/Components/Reports/ReportKit';
import { TrendChart } from '@/Components/Reports/ReportCharts';

export default function CashFlow({ operating, investing, financing, filters = {} }) {
    const { store } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const netCashFlow = operating + investing + financing;

    const applyDateFilter = (start = startDate, end = endDate) => {
        router.get(route('store.reports.cash-flow', { store_slug: store.slug }), {
            start_date: start,
            end_date: end,
        }, { preserveState: true, preserveScroll: true });
    };

    const rows = [
        { id: 'op', label: 'Operating activities', amount: operating },
        { id: 'inv', label: 'Investing activities', amount: investing },
        { id: 'fin', label: 'Financing activities', amount: financing },
    ];
    const inflow = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const outflow = rows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
    const chartSeries = [
        { name: 'Cash in', points: rows.map((r) => ({ x: r.label.replace(' activities', ''), y: Math.max(r.amount, 0) })) },
        { name: 'Cash out', points: rows.map((r) => ({ x: r.label.replace(' activities', ''), y: Math.max(-r.amount, 0) })) },
    ];

    const summary = [
        { id: 'begin', label: 'Cash at beginning of period', amount: 0 },
        { id: 'net', label: 'Net increase / decrease in cash', amount: netCashFlow },
        { id: 'end', label: 'Cash at end of period', amount: netCashFlow },
    ];

    const filterNode = (
        <>
            <DateRangeFilter
                from={startDate}
                to={endDate}
                onChange={({ from, to }) => { setStartDate(from); setEndDate(to); applyDateFilter(from, to); }}
            />
        </>
    );

    return (
        <ReportShell
            title="Cash Flow Statement"
            subtitle={`${filters.start_date || ''} to ${filters.end_date || ''}`}
            activeKey="cash-flow"
            filters={filterNode}
            exportConfig={{
                filename: 'cash-flow',
                columns: [{ label: 'Line', get: (r) => r.label }, { label: 'Amount', get: (r) => r.amount }],
                rows: [...rows, ...summary],
            }}
        >
            <ReportKpis items={[
                { label: 'Operating', value: formatCurrency(operating, store), icon: TrendingUp, tone: 'emerald', valueTone: operating < 0 ? 'rose' : undefined },
                { label: 'Investing', value: formatCurrency(investing, store), icon: Landmark, tone: 'blue', valueTone: investing < 0 ? 'rose' : undefined },
                { label: 'Financing', value: formatCurrency(financing, store), icon: Wallet, tone: 'violet', valueTone: financing < 0 ? 'rose' : undefined },
                { label: 'Net Cash Flow', value: formatCurrency(netCashFlow, store), icon: RefreshCw, tone: netCashFlow >= 0 ? 'emerald' : 'rose', valueTone: netCashFlow >= 0 ? 'emerald' : 'rose', trend: netCashFlow >= 0 ? 'up' : 'down' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Cash in vs cash out" subtitle="By activity">
                        <TrendChart series={chartSeries} type="bar" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Totals">
                        <ul className="flex flex-col gap-2">
                            <li className="flex h-12 items-center justify-between rounded-[12px] bg-app px-4"><span className="text-sm text-ink-secondary">Cash in</span><span className="font-bold tabular-nums text-emerald-600">{formatCurrency(inflow, store)}</span></li>
                            <li className="flex h-12 items-center justify-between rounded-[12px] bg-app px-4"><span className="text-sm text-ink-secondary">Cash out</span><span className="font-bold tabular-nums text-rose-600">{formatCurrency(outflow, store)}</span></li>
                            <li className="flex h-12 items-center justify-between rounded-[12px] bg-brand-600 px-4 font-bold text-white"><span className="text-sm">Net</span><span className="tabular-nums">{formatCurrency(netCashFlow, store)}</span></li>
                        </ul>
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Summary breakdown" flush>
                <ReportTable
                    columns={[
                        { key: 'label', label: 'Line', render: (r) => <span className="font-medium text-ink">{r.label}</span> },
                        { key: 'amount', label: 'Amount', align: 'right', render: (r) => (
                            <span className={`font-bold tabular-nums ${r.amount < 0 ? 'text-rose-600' : 'text-ink'}`}>{formatCurrency(r.amount, store)}</span>
                        ) },
                    ]}
                    rows={[...rows, ...summary]}
                    rowKey={(r) => r.id}
                    pageSize={0}
                />
            </ReportSection>
        </ReportShell>
    );
}
