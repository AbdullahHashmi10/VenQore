import React, { useState, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Activity, ArrowDownLeft, ArrowUpRight, Hash } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

const IN_TYPES = ['Sale', 'Payment In'];
const day = (d) => String(d || '').slice(0, 10);

export default function TransactionsReport({ transactions = {}, filters = {} }) {
    const { store } = usePage().props;

    const [allTransactions, setAllTransactions] = useState(transactions.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(transactions.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setAllTransactions(transactions.data || []);
        setNextPageUrl(transactions.next_page_url);
    }, [transactions]);

    const loadMore = useCallback(async () => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await axios.get(nextPageUrl, { headers: { Accept: 'application/json' } });
            setAllTransactions((prev) => {
                const existingIds = new Set(prev.map((p) => p.id + '-' + p.type)); // IDs overlap between tables
                const uniqueNew = res.data.data.filter((p) => !existingIds.has(p.id + '-' + p.type));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(res.data.next_page_url);
        } catch (e) {
            console.error('Failed to load more transactions', e);
        } finally {
            setLoadingMore(false);
        }
    }, [nextPageUrl, loadingMore]);

    const go = (patch) => {
        router.get(route('store.reports.transactions', { store_slug: store.slug }), { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    let moneyIn = 0; let moneyOut = 0;
    const perDay = {}; const byType = {};
    allTransactions.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const incoming = IN_TYPES.includes(t.type);
        if (incoming) moneyIn += amt; else moneyOut += amt;
        byType[t.type] = (byType[t.type] || 0) + amt;
        const k = day(t.date);
        if (k) { perDay[k] = perDay[k] || { in: 0, out: 0 }; perDay[k][incoming ? 'in' : 'out'] += amt; }
    });
    const days = Object.keys(perDay).sort();
    const series = [
        { name: 'In', points: days.map((d) => ({ x: d, y: perDay[d].in })) },
        { name: 'Out', points: days.map((d) => ({ x: d, y: perDay[d].out })) },
    ];

    const columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'type', label: 'Type', sortable: true, render: (row) => <span className="font-medium text-ink-secondary">{row.type}</span> },
        { key: 'ref', label: 'Reference', get: (row) => row.id, render: (row) => <span className="font-mono text-xs text-ink-muted">{row.id}</span> },
        { key: 'party', label: 'Party', render: (row) => row.party || '-' },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (row) => (
            <span className={`font-bold tabular-nums ${IN_TYPES.includes(row.type) ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-secondary'}`}>{formatCurrency(row.amount)}</span>
        ) },
        { key: 'status', label: 'Status', render: (row) => (
            <span className="rounded-full bg-sunken px-2 py-1 text-xs font-medium uppercase text-ink-secondary">{row.status || '-'}</span>
        ) },
    ];

    return (
        <ReportShell
            title="All Transactions"
            activeKey="transactions"
            filters={<DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => go({ start_date: from, end_date: to })} />}
            exportConfig={{
                filename: 'transactions',
                columns: [
                    { label: 'Date', get: (r) => r.date },
                    { label: 'Type', get: (r) => r.type },
                    { label: 'Reference', get: (r) => r.id },
                    { label: 'Party', get: (r) => r.party },
                    { label: 'Amount', get: (r) => r.amount },
                    { label: 'Status', get: (r) => r.status },
                ],
                rows: allTransactions,
            }}
        >
            <ReportKpis items={[
                { label: 'Transactions', value: String(allTransactions.length), icon: Hash, tone: 'slate', sub: nextPageUrl ? 'More available' : undefined },
                { label: 'Money In', value: formatCurrency(moneyIn), icon: ArrowDownLeft, tone: 'emerald', valueTone: 'emerald' },
                { label: 'Money Out', value: formatCurrency(moneyOut), icon: ArrowUpRight, tone: 'rose', valueTone: 'rose' },
                { label: 'Net', value: formatCurrency(moneyIn - moneyOut), icon: Activity, tone: 'brand' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="In vs out" subtitle="Per day, loaded transactions">
                        <TrendChart series={series} type="bar" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="By type">
                        <DonutChart slices={Object.keys(byType).map((k) => ({ name: k, value: byType[k] }))} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection
                title="Transactions"
                subtitle={`${allTransactions.length} loaded`}
                flush
                right={nextPageUrl ? (
                    <button type="button" onClick={loadMore} disabled={loadingMore}
                        className="h-10 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover disabled:opacity-50">
                        {loadingMore ? 'Loading...' : 'Load more'}
                    </button>
                ) : null}
            >
                <ReportTable columns={columns} rows={allTransactions} rowKey={(r, i) => `${r.id}-${r.type}-${i}`} />
            </ReportSection>
        </ReportShell>
    );
}
