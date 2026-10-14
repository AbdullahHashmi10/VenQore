import React, { useState, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Search, PackageMinus, ArrowUpRight, Hash, Users, TrendingDown, Building2 } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, FilterSelect, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const RANGES = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
];

const statusCls = (s) => (s === 'refunded' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    : s === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400');

export default function PurchaseReturnsReport({ returns = [], filters = {}, suppliers = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || '');

    const handleFilterChange = (range, supplier) => {
        setDateRange(range);
        setSupplierId(supplier);
        router.get(route('store.reports.purchase-returns', {
            store_slug: store.slug,
            range: range,
            supplier_id: supplier,
        }), {}, { preserveState: true });
    };

    const processedData = useMemo(() => {
        if (!searchQuery) return returns;
        const q = searchQuery.toLowerCase();
        return returns.filter((ret) =>
            (ret.reference_number || '').toLowerCase().includes(q) ||
            (ret.supplier?.name || '').toLowerCase().includes(q) ||
            (ret.reason || '').toLowerCase().includes(q));
    }, [returns, searchQuery]);

    const totalReturnAmount = useMemo(() => processedData.reduce((s, r) => s + parseFloat(r.amount || 0), 0), [processedData]);

    const charts = useMemo(() => {
        const daily = {}; const sup = {}; const status = {};
        processedData.forEach((r) => {
            const amt = parseFloat(r.amount || 0);
            const d = r.date ? String(r.date).split('T')[0].split(' ')[0] : '';
            if (d) daily[d] = (daily[d] || 0) + amt;
            const n = r.supplier?.name || 'Walk-in';
            sup[n] = (sup[n] || 0) + amt;
            const s = r.status || 'pending';
            status[s] = (status[s] || 0) + amt;
        });
        return {
            trend: Object.keys(daily).sort().map((x) => ({ x, y: parseFloat(daily[x].toFixed(2)) })),
            suppliers: Object.entries(sup).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
            status: Object.entries(status).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
        };
    }, [processedData]);

    const avg = processedData.length ? totalReturnAmount / processedData.length : 0;

    const columns = [
        { key: 'ref', label: 'Ref Number', sortable: true, get: (r) => r.reference_number || `#${r.id}`, render: (r) => <span className="font-bold text-ink">{r.reference_number || `#${r.id}`}</span> },
        { key: 'date', label: 'Date', sortable: true, get: (r) => r.date || '', render: (r) => new Date(r.date).toLocaleDateString() },
        { key: 'supplier', label: tt('Supplier'), sortable: true, get: (r) => r.supplier?.name || 'Walk-in', render: (r) => <span className="font-bold text-ink">{r.supplier?.name || 'Walk-in'}</span> },
        { key: 'reason', label: 'Reason', get: (r) => r.reason || '', render: (r) => <span className="italic text-ink-muted">{r.reason || '—'}</span> },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, get: (r) => parseFloat(r.amount || 0), render: (r) => <span className="font-bold text-rose-600">{formatCurrency(r.amount, store)}</span> },
        { key: 'status', label: 'Status', align: 'center', sortable: true, get: (r) => r.status || '', render: (r) => <span className={`inline-flex items-center rounded-[12px] px-2 py-0.5 text-2xs font-bold uppercase ${statusCls(r.status)}`}>{r.status}</span> },
        { key: 'actions', label: 'Actions', align: 'center', render: (r) => (
            <Link href={route('store.debit-notes.show', { store_slug: store?.slug, id: r.id })}
                className="inline-flex items-center gap-1 text-2xs font-bold uppercase text-brand-600 hover:underline dark:text-brand-400">
                View Details <ArrowUpRight size={12} />
            </Link>
        ) },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                <input type="text" placeholder={tt('Search by Supplier name or ID...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${filterInputCls} w-64 pl-9`} />
            </div>
            <FilterSelect label="Period" value={dateRange} onChange={(v) => handleFilterChange(v, supplierId)} options={RANGES} />
            <FilterSelect value={supplierId} onChange={(v) => handleFilterChange(dateRange, v)}
                options={[{ value: '', label: tt('All Suppliers') }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]} />
        </>
    );

    return (
        <ReportShell
            title="Purchase Returns Report"
            subtitle={tt('Track and analyze stock returns and debit notes sent to suppliers.')}
            filters={filterNode}
            exportConfig={{
                filename: 'purchase-returns',
                columns: [
                    { label: 'Ref Number', get: (r) => r.reference_number || `#${r.id}` },
                    { label: 'Date', get: (r) => r.date },
                    { label: tt('Supplier'), get: (r) => r.supplier?.name || 'Walk-in' },
                    { label: 'Reason', get: (r) => r.reason || '' },
                    { label: 'Amount', get: (r) => r.amount },
                    { label: 'Status', get: (r) => r.status },
                ],
                rows: processedData,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Returned', value: formatCurrency(totalReturnAmount, store), icon: PackageMinus, tone: 'rose', valueTone: 'rose' },
                { label: 'Debit Notes', value: processedData.length, icon: Hash, tone: 'brand' },
                { label: 'Average Return', value: formatCurrency(avg, store), icon: TrendingDown, tone: 'amber' },
                { label: tt('Suppliers'), value: charts.suppliers.length, icon: Building2, tone: 'violet' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Returns trend" subtitle="Value returned per day" icon={TrendingDown} tone="rose">
                        <TrendChart series={[{ name: 'Returned', points: charts.trend }]} type="bar" unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="By status" subtitle="Returned value" icon={PackageMinus} tone="amber">
                        <DonutChart slices={charts.status} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title={tt('Returns by supplier')} icon={Users} tone="violet">
                <RankBars items={charts.suppliers} unit="currency" />
            </ReportSection>

            <ReportSection title="Purchase returns" subtitle={`${processedData.length} records`} flush>
                <ReportTable columns={columns} rows={processedData} rowKey={(r) => r.id} empty="No purchase returns found for the selected criteria." />
            </ReportSection>
        </ReportShell>
    );
}
