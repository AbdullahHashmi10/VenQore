import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Percent, Search, Tag, Users, TrendingUp, AlertTriangle, Receipt, PieChart as PieIcon, Gauge, ArrowDownCircle,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const pctOf = (inv) => {
    const subTotal = Number(inv.total_amount) + Number(inv.discount);
    return subTotal > 0 ? (Number(inv.discount) / subTotal) * 100 : 0;
};

function DiscountBadge({ pct }) {
    const cls = pct < 5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : pct < 15 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    return <span className={`rounded-[12px] px-2 py-1 text-2xs font-bold ${cls}`}>{pct.toFixed(1)}%</span>;
}

export default function DiscountReport({ invoices = [], filters = {} }) {
    const tt = useTermText();
    const { store } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [from, setFrom] = useState(filters.start_date || '');
    const [to, setTo] = useState(filters.end_date || '');

    // --- Derived Data ---
    const processedData = useMemo(() => {
        let data = invoices.filter(inv => Number(inv.discount) > 0); // Only bills with discount
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(inv =>
                inv.invoice_number.toString().toLowerCase().includes(lowerQ) ||
                (inv.party?.name || '').toLowerCase().includes(lowerQ)
            );
        }
        return [...data].sort((a, b) => Number(b.discount) - Number(a.discount));
    }, [invoices, searchQuery]);

    // --- Stats ---
    const stats = useMemo(() => {
        const totalDiscount = processedData.reduce((acc, curr) => acc + Number(curr.discount), 0);
        const billTotal = processedData.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
        const count = processedData.length;
        const avgDiscount = count > 0 ? totalDiscount / count : 0;
        let maxDiscount = 0;
        let heavyDiscountCount = 0; // > 15%
        processedData.forEach(inv => {
            const val = Number(inv.discount);
            if (val > maxDiscount) maxDiscount = val;
            if (pctOf(inv) > 15) heavyDiscountCount++;
        });
        const rate = totalDiscount + billTotal > 0 ? (totalDiscount / (totalDiscount + billTotal)) * 100 : 0;
        return { totalDiscount, count, avgDiscount, maxDiscount, heavyDiscountCount, rate };
    }, [processedData]);

    const severitySlices = useMemo(() => {
        let low = 0, medium = 0, high = 0;
        processedData.forEach(inv => {
            const pct = pctOf(inv);
            if (pct < 5) low++;
            else if (pct < 15) medium++;
            else high++;
        });
        return [
            { name: 'Light (<5%)', value: low },
            { name: 'Standard (5-15%)', value: medium },
            { name: 'Heavy (>15%)', value: high },
        ].filter(d => d.value > 0);
    }, [processedData]);

    const topCustomers = useMemo(() => {
        const map = {};
        processedData.forEach(inv => {
            const name = inv.party?.name || 'Walk-in';
            map[name] = map[name] || { value: 0, n: 0 };
            map[name].value += Number(inv.discount);
            map[name].n += 1;
        });
        return Object.entries(map).map(([label, v]) => ({ label, value: v.value, sub: `${v.n} bills` })).sort((a, b) => b.value - a.value);
    }, [processedData]);

    const daily = useMemo(() => {
        const map = {};
        processedData.forEach(inv => {
            if (!inv.created_at) return;
            const k = ymd(new Date(inv.created_at));
            map[k] = (map[k] || 0) + Number(inv.discount);
        });
        return Object.keys(map).sort().map(k => ({ x: k, y: map[k] }));
    }, [processedData]);

    const applyRange = ({ from: f, to: t }) => {
        setFrom(f || '');
        setTo(t || '');
        if (f && t) {
            router.get(route("store.reports.discount-report", {
                store_slug: store.slug
            }), { range: 'custom', start_date: f, end_date: t }, { preserveState: true, preserveScroll: true });
        }
    };

    const columns = [
        { key: 'invoice_number', label: 'Invoice', sortable: true, get: (i) => `#${i.invoice_number}`, render: (i) => <span className="font-mono font-bold text-brand-600 dark:text-brand-400">#{i.invoice_number}</span> },
        { key: 'created_at', label: 'Date', sortable: true, get: (i) => (i.created_at ? ymd(new Date(i.created_at)) : ''), render: (i) => new Date(i.created_at).toLocaleDateString() },
        { key: 'party_name', label: tt('Customer'), sortable: true, get: (i) => i.party?.name || 'Walk-in' },
        { key: 'total_amount', label: 'Bill Total', align: 'right', sortable: true, get: (i) => Number(i.total_amount) || 0, render: (i) => formatCurrency(i.total_amount, store) },
        { key: 'discount', label: 'Amount Off', align: 'right', sortable: true, get: (i) => Number(i.discount) || 0, render: (i) => <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">-{formatCurrency(i.discount, store)}</span> },
        { key: 'percentage', label: '%', align: 'right', sortable: true, get: (i) => pctOf(i).toFixed(1), render: (i) => <DiscountBadge pct={pctOf(i)} /> },
    ];

    const kpis = [
        { label: 'Total Discounts', value: formatCurrency(stats.totalDiscount, store), icon: Tag, tone: 'rose' },
        { label: 'Discounted Bills', value: formatNumber(stats.count), icon: Percent, tone: 'brand', sub: `${stats.count > 0 ? ((stats.count / invoices.length) * 100).toFixed(1) : 0}% of total bills` },
        { label: 'Avg per Bill', value: formatCurrency(stats.avgDiscount, store), icon: TrendingUp, tone: 'blue' },
        { label: 'Biggest Discount', value: formatCurrency(stats.maxDiscount, store), icon: ArrowDownCircle, tone: 'violet' },
        { label: 'Discount Rate', value: `${stats.rate.toFixed(1)}%`, icon: Gauge, tone: 'sky', sub: 'Of gross value' },
        { label: 'Heavy Discounts', value: formatNumber(stats.heavyDiscountCount), icon: AlertTriangle, tone: 'amber', sub: 'Bills with > 15%' },
    ];

    const filterNode = (
        <>
            <DateRangeFilter from={from} to={to} onChange={applyRange} />
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={14} />
                <input type="text" placeholder={tt('Search Customer...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${filterInputCls} w-56 pl-9`} />
            </div>
        </>
    );

    return (
        <ReportShell
            title="Discount Report"
            subtitle="Tracking giveaways & price reductions"
            filters={filterNode}
            exportConfig={{ filename: 'discount-report', columns: columns.map((c) => ({ label: c.label, get: c.get })), rows: processedData }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Discounts Given" subtitle="Total discount per day" icon={TrendingUp} tone="rose">
                        <TrendChart points={daily} label="Discount" type="area" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Discount Range" subtitle="Bills by discount size" icon={PieIcon} tone="amber">
                        <DonutChart slices={severitySlices} unit="integer" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title={tt('Top Discounted Customers')} subtitle="By total discount received" icon={Users} tone="violet">
                <RankBars items={topCustomers} colorIndex={3} />
            </ReportSection>

            <ReportSection title="Discount Details" subtitle={`${processedData.length} records`} icon={Receipt} flush>
                <ReportTable columns={columns} rows={processedData} rowKey={(i, idx) => i.id ?? idx} pageSize={25} empty="No discounts found" />
            </ReportSection>
        </ReportShell>
    );
}
