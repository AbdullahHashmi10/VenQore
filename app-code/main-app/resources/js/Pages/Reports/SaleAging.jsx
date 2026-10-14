import React, { useState, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Clock, Search, Users, TrendingUp, AlertTriangle, AlertOctagon, Calendar, Receipt, PieChart as PieIcon, BarChart3,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const BUCKETS = ['all', '0-30', '30-60', '60-90', '90+'];
const BUCKET_NAMES = { '0-30': '0-30 Days', '30-60': '30-60 Days', '60-90': '60-90 Days', '90+': '90+ Days' };

function AgingBadge({ category }) {
    const base = 'rounded-[12px] px-2 py-1 text-2xs font-bold';
    if (category === '90+') return <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}>Critical 90+</span>;
    if (category === '60-90') return <span className={`${base} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`}>High 60-90</span>;
    if (category === '30-60') return <span className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>At Risk 30-60</span>;
    return <span className={`${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`}>Fresh 0-30</span>;
}

export default function SaleAging({ invoices = [], filters = {} }) {
    const tt = useTermText();
    const { store } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [bucketFilter, setBucketFilter] = useState('all'); // all, 0-30, 30-60, 60-90, 90+

    // --- Derived Data ---
    const processedInvoices = useMemo(() => {
        let data = [...invoices];
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(inv =>
                inv.invoice_number.toString().toLowerCase().includes(lowerQ) ||
                (inv.party || '').toLowerCase().includes(lowerQ)
            );
        }
        if (bucketFilter !== 'all') {
            data = data.filter(inv => inv.category === bucketFilter);
        }
        return data.sort((a, b) => Number(b.days) - Number(a.days));
    }, [invoices, searchQuery, bucketFilter]);

    // --- Stats ---
    const stats = useMemo(() => {
        const totalOutstanding = processedInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const count = processedInvoices.length;
        const buckets = { '0-30': 0, '30-60': 0, '60-90': 0, '90+': 0 };
        let criticalAmount = 0;
        processedInvoices.forEach(inv => {
            const amt = Number(inv.amount);
            if (buckets[inv.category] !== undefined) buckets[inv.category] += amt;
            else buckets['90+'] += amt; // Fallback
            if (inv.category === '90+' || inv.category === '60-90') criticalAmount += amt;
        });
        const riskScore = totalOutstanding > 0 ? (criticalAmount / totalOutstanding) * 100 : 0;
        return { totalOutstanding, count, buckets, criticalAmount, riskScore };
    }, [processedInvoices]);

    const bucketPoints = Object.keys(BUCKET_NAMES).map(k => ({ x: BUCKET_NAMES[k], y: stats.buckets[k] }));
    const agingSlices = Object.keys(BUCKET_NAMES).map(k => ({ name: BUCKET_NAMES[k], value: stats.buckets[k] })).filter(d => d.value > 0);

    // Parties: one row per debtor
    const parties = useMemo(() => {
        const map = {};
        processedInvoices.forEach(inv => {
            const name = inv.party || 'Unknown';
            map[name] = map[name] || { party: name, invoices: 0, amount: 0, oldest: 0 };
            map[name].invoices += 1;
            map[name].amount += Number(inv.amount);
            map[name].oldest = Math.max(map[name].oldest, Number(inv.days) || 0);
        });
        return Object.values(map).sort((a, b) => b.amount - a.amount);
    }, [processedInvoices]);

    const invoiceColumns = [
        { key: 'invoice_number', label: 'Invoice', sortable: true, get: (i) => `#${i.invoice_number}`, render: (i) => <span className="font-mono font-bold text-brand-600 dark:text-brand-400">#{i.invoice_number}</span> },
        { key: 'party', label: tt('Customer'), sortable: true, get: (i) => i.party },
        { key: 'amount', label: 'Owed Amount', align: 'right', sortable: true, get: (i) => Number(i.amount) || 0, render: (i) => <span className="font-bold tabular-nums text-ink">{formatCurrency(i.amount, store)}</span> },
        { key: 'days', label: 'Days Old', align: 'center', sortable: true, get: (i) => Number(i.days) || 0, render: (i) => `${i.days}d` },
        { key: 'category', label: 'Status', align: 'center', sortable: true, get: (i) => i.category, render: (i) => <AgingBadge category={i.category} /> },
    ];
    const partyColumns = [
        { key: 'party', label: tt('Customer'), sortable: true, get: (p) => p.party },
        { key: 'invoices', label: 'Open Bills', align: 'center', sortable: true, get: (p) => p.invoices },
        { key: 'oldest', label: 'Oldest', align: 'center', sortable: true, get: (p) => p.oldest, render: (p) => `${p.oldest}d` },
        { key: 'amount', label: 'Outstanding', align: 'right', sortable: true, get: (p) => p.amount, render: (p) => <span className="font-bold tabular-nums text-ink">{formatCurrency(p.amount, store)}</span> },
        { key: 'share', label: 'Share', align: 'right', sortable: true, get: (p) => (stats.totalOutstanding > 0 ? ((p.amount / stats.totalOutstanding) * 100).toFixed(1) : '0.0'), render: (p) => `${stats.totalOutstanding > 0 ? ((p.amount / stats.totalOutstanding) * 100).toFixed(1) : '0.0'}%` },
    ];

    const kpis = [
        { label: 'Total Outstanding', value: formatCurrency(stats.totalOutstanding, store), icon: AlertOctagon, tone: 'brand', sub: `${formatNumber(stats.count)} open invoices` },
        { label: 'Critical Amount (>60d)', value: formatCurrency(stats.criticalAmount, store), icon: AlertTriangle, tone: 'rose', valueTone: stats.criticalAmount > 0 ? 'rose' : undefined, sub: 'Immediate action required' },
        { label: 'Risk Exposure', value: `${stats.riskScore.toFixed(1)}%`, icon: TrendingUp, tone: 'amber', sub: '% of debt > 60 days' },
        { label: 'Fresh Debt (<30d)', value: formatCurrency(stats.buckets['0-30'], store), icon: Calendar, tone: 'emerald', sub: 'Healthy receivables' },
        { label: '30-60 Days', value: formatCurrency(stats.buckets['30-60'], store), icon: Clock, tone: 'blue' },
        { label: tt('Debtors'), value: formatNumber(parties.length), icon: Users, tone: 'violet' },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={14} />
                <input type="text" placeholder="Search Debtor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${filterInputCls} w-56 pl-9`} />
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {BUCKETS.map((b) => (
                    <button key={b} type="button" onClick={() => setBucketFilter(b)}
                        className={`h-10 rounded-[12px] px-3 text-sm font-semibold transition-colors ${bucketFilter === b ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>
                        {b === 'all' ? 'All Buckets' : `${b} Days`}
                    </button>
                ))}
            </div>
        </>
    );

    return (
        <ReportShell
            title="Receivables Aging"
            subtitle="Tracking outstanding receivables"
            filters={filterNode}
            exportConfig={{ filename: 'sale-aging', columns: invoiceColumns.map((c) => ({ label: c.label, get: c.get })), rows: processedInvoices }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Aging Buckets" subtitle="Outstanding amount by age" icon={BarChart3} tone="amber">
                        <TrendChart points={bucketPoints} label="Outstanding" type="bar" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Aging Breakdown" subtitle="Share of outstanding" icon={PieIcon} tone="rose">
                        <DonutChart slices={agingSlices} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Top Debtors" subtitle="By outstanding amount" icon={Users} tone="violet">
                <RankBars items={parties.map(p => ({ label: p.party, value: p.amount, sub: `${p.invoices} bills` }))} />
            </ReportSection>

            <ReportSection title={tt('Debtors')} subtitle={`${parties.length} parties`} icon={Users} flush>
                <ReportTable columns={partyColumns} rows={parties} rowKey={(p) => p.party} pageSize={15} empty="No outstanding bills found" />
            </ReportSection>

            <ReportSection title="Aging Details" subtitle={`${processedInvoices.length} bills`} icon={Receipt} flush>
                <ReportTable columns={invoiceColumns} rows={processedInvoices} rowKey={(i, idx) => `${i.invoice_number}-${idx}`} pageSize={25} empty="No outstanding bills found" />
            </ReportSection>
        </ReportShell>
    );
}
