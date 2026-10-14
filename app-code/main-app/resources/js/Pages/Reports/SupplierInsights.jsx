import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, Truck, DollarSign, Clock, ShoppingBag, X, AlertTriangle, BarChart2, Activity } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, FilterSelect, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { RankBars } from '@/Components/Reports/ReportCharts';

const RANGES = [
    { value: 'today', label: 'Today' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
];

export default function SupplierInsights({ data = [], stats = [], filters = {} }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [search, setSearch] = useState('');
    const [selectedPair, setSelectedPair] = useState(null);
    const [modalDetails, setModalDetails] = useState({ purchases: [], other_products: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const go = (params) => router.get(route('store.reports.supplier-insights', { store_slug: store.slug }),
        params, { preserveState: true, preserveScroll: true });

    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            const params = new URLSearchParams(window.location.search);
            params.set('range', r);
            params.delete('start_date');
            params.delete('end_date');
            go(Object.fromEntries(params.entries()));
        }
    };

    const onDates = ({ from, to }) => {
        setStartDate(from || '');
        setEndDate(to || '');
        setRange('custom');
        if (from && to) {
            const params = new URLSearchParams(window.location.search);
            params.set('range', 'custom');
            params.set('start_date', from);
            params.set('end_date', to);
            go(Object.fromEntries(params.entries()));
        }
    };

    const filtered = useMemo(() => data.filter((row) =>
        !search ||
        (row.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (row.product_name || '').toLowerCase().includes(search.toLowerCase())), [data, search]);

    const byVariance = useMemo(() => [...data].sort((a, b) => (b.cost_variance_pct || 0) - (a.cost_variance_pct || 0)), [data]);
    const highRiskPairs = byVariance.slice(0, 3);

    const handleSelectPair = (pair) => {
        setSelectedPair(pair);
        if (!pair) { setModalDetails({ purchases: [], other_products: [] }); return; }
        setIsLoadingDetails(true);
        fetch(route('store.reports.supplier-insights.details', {
            store_slug: store.slug,
            supplier_id: pair.supplier_id,
            product_id: pair.product_id,
            start_date: filters.start_date || startDate,
            end_date: filters.end_date || endDate,
        }))
            .then((res) => res.json())
            .then((json) => {
                setModalDetails({ purchases: json.purchases || [], other_products: json.other_products || [] });
                setIsLoadingDetails(false);
            })
            .catch((err) => { console.error(err); setIsLoadingDetails(false); });
    };

    const kpis = stats.map((s) => {
        let tone = 'rose'; let icon = DollarSign;
        if (s.label.includes('Pairs')) { tone = 'brand'; icon = Truck; }
        if (s.label.includes('Volume')) tone = 'emerald';
        return { label: s.label, value: s.value, icon, tone };
    });

    const columns = [
        { key: 'supplier_name', label: tt('Supplier'), sortable: true, get: (r) => r.supplier_name || '', render: (r) => <span className="font-bold text-ink">{r.supplier_name}</span> },
        { key: 'product_name', label: tt('Sourced Item'), sortable: true, get: (r) => r.product_name || '', render: (r) => <span className="font-bold text-brand-600">{r.product_name}</span> },
        { key: 'purchase_count', label: 'Purchases', align: 'right', sortable: true, get: (r) => r.purchase_count || 0 },
        { key: 'total_qty_purchased', label: 'Qty', align: 'right', sortable: true, get: (r) => r.total_qty_purchased || 0 },
        { key: 'cost_variance_pct', label: 'Cost Variance', align: 'right', sortable: true, get: (r) => r.cost_variance_pct || 0,
            render: (r) => <span className={`rounded-[12px] px-2 py-0.5 text-2xs font-bold ${r.cost_variance_pct > 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20'}`}>{r.cost_variance_pct}%</span> },
        { key: 'avg_unit_cost', label: 'Avg Cost', align: 'right', sortable: true, get: (r) => r.avg_unit_cost || 0, render: (r) => formatCurrency(r.avg_unit_cost, store) },
        { key: 'min_unit_cost', label: 'Low', align: 'right', sortable: true, get: (r) => r.min_unit_cost || 0, render: (r) => <span className="font-bold text-emerald-600">{formatCurrency(r.min_unit_cost, store)}</span> },
        { key: 'max_unit_cost', label: 'High', align: 'right', sortable: true, get: (r) => r.max_unit_cost || 0, render: (r) => <span className="font-bold text-rose-600">{formatCurrency(r.max_unit_cost, store)}</span> },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                <input type="text" placeholder={tt('Search supplier or product...')} value={search} onChange={(e) => setSearch(e.target.value)}
                    className={`${filterInputCls} w-64 pl-9`} />
            </div>
            <FilterSelect label="Period" value={range} onChange={handleRangeChange} options={RANGES} />
            <DateRangeFilter from={startDate} to={endDate} onChange={onDates} presets={false} />
        </>
    );

    return (
        <ReportShell
            title={tt('Supplier Insights')}
            subtitle={tt('Trace supplier sourcing performance, unit cost variance, and inflation drifts')}
            filters={filterNode}
            exportConfig={{
                filename: 'supplier-insights',
                columns: columns.map((c) => ({ label: c.label, get: (r) => r[c.key] })),
                rows: filtered,
            }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Peak pricing variances" subtitle="Highest cost spread by supplier and item" icon={BarChart2} tone="rose">
                        <RankBars unit="percentage" limit={8}
                            items={byVariance.map((r) => ({ label: `${r.product_name || ''} (${r.supplier_name || ''})`, value: r.cost_variance_pct || 0 }))} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Sourcing risk audit" subtitle="Click a pair to inspect cost movements and bills" icon={Activity} tone="amber">
                        <div className="flex flex-col gap-2">
                            <div className="rounded-[12px] border border-line bg-app p-3 text-xs text-ink-secondary">
                                <p className="mb-1 flex items-center gap-2 font-bold text-ink"><AlertTriangle size={12} className="text-rose-500" /> High price fluctuation</p>
                                Pricing for <strong>{highRiskPairs[0]?.product_name || 'N/A'}</strong> from <strong>{highRiskPairs[0]?.supplier_name || 'N/A'}</strong> shifted by <strong className="text-rose-600">{highRiskPairs[0]?.cost_variance_pct || 0}%</strong>.
                            </div>
                            {highRiskPairs.map((p, idx) => (
                                <button key={idx} type="button" onClick={() => handleSelectPair(p)}
                                    className="flex h-12 items-center justify-between gap-2 rounded-[12px] border border-line px-3 text-left transition-colors hover:border-brand-300">
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-ink">{p.supplier_name}</span>
                                        <span className="block truncate text-2xs text-ink-muted">{p.product_name}</span>
                                    </span>
                                    <span className="shrink-0 font-mono text-sm font-bold text-rose-600">{p.cost_variance_pct}%</span>
                                </button>
                            ))}
                            <p className="text-xs text-ink-muted">{tt('High cost variance (over 10%) suggests volatile supplier pricing that eats into margins. Re-negotiate rates or check secondary suppliers.')}</p>
                        </div>
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Sourcing price variance matrix" subtitle={`${filtered.length} supplier and item pairs. Click a row for the bill history`} flush>
                <ReportTable columns={columns} rows={filtered} rowKey={(r, i) => `${r.supplier_id}-${r.product_id}-${i}`} onRowClick={handleSelectPair} empty={tt('No supplier insights found.')} />
            </ReportSection>

            {selectedPair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-2xs font-bold uppercase tracking-wider text-rose-600">{tt('Supplier Sourcing Analysis')}</p>
                                <h2 className="truncate text-lg font-bold text-ink">{selectedPair.supplier_name}</h2>
                                <p className="text-xs text-ink-muted">{tt('Sourced Product:')} <span className="font-bold text-ink-secondary">{selectedPair.product_name}</span></p>
                            </div>
                            <button type="button" onClick={() => handleSelectPair(null)} className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-muted hover:bg-interactive-hover"><X size={18} /></button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                            <ReportKpis min={200} items={[
                                { label: 'Total Qty Purchased', value: selectedPair.total_qty_purchased, icon: ShoppingBag, tone: 'brand' },
                                { label: 'Average Unit Cost', value: formatCurrency(selectedPair.avg_unit_cost, store), icon: DollarSign, tone: 'rose' },
                                { label: 'Cost Variance', value: `${selectedPair.cost_variance_pct}%`, icon: AlertTriangle, tone: 'amber' },
                            ]} />
                            {isLoadingDetails ? (
                                <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">Querying Ledger...</div>
                            ) : (
                                <ReportGrid>
                                    <ReportCol span={6}>
                                        <ReportSection title="Sourcing Purchase History" icon={Clock} tone="rose" flush>
                                            <ReportTable pageSize={10} empty="No purchase invoice logs found in this period." rows={modalDetails.purchases}
                                                columns={[
                                                    { key: 'date', label: 'Date', render: (r) => <span className="font-mono text-ink-muted">{r.date}</span> },
                                                    { key: 'invoice_no', label: 'PO Bill No', render: (r) => <span className="font-semibold">{r.invoice_no}</span> },
                                                    { key: 'unit_cost', label: 'Cost', align: 'right', render: (r) => <span className="font-bold">{formatCurrency(r.unit_cost, store)} <span className="text-2xs font-normal text-ink-muted">x{r.quantity}</span></span> },
                                                    { key: 'total', label: 'Total', align: 'right', render: (r) => <span className="font-bold text-ink">{formatCurrency(r.total, store)}</span> },
                                                ]} />
                                        </ReportSection>
                                    </ReportCol>
                                    <ReportCol span={6}>
                                        <ReportSection title="Other Sourced Catalog" icon={ShoppingBag} tone="violet" flush>
                                            <ReportTable pageSize={10} empty={tt('No other products sourced from this supplier.')} rows={modalDetails.other_products}
                                                columns={[
                                                    { key: 'name', label: tt('Product'), render: (r) => <span className="font-bold text-ink">{r.name} <span className="font-mono text-3xs font-normal text-ink-muted">{r.sku}</span></span> },
                                                    { key: 'quantity', label: 'Qty Sourced', align: 'right' },
                                                    { key: 'avg_cost', label: 'Avg Cost', align: 'right', render: (r) => <span className="font-bold text-ink">{formatCurrency(r.avg_cost, store)}</span> },
                                                ]} />
                                        </ReportSection>
                                    </ReportCol>
                                </ReportGrid>
                            )}
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-line p-2">
                            <button type="button" onClick={() => handleSelectPair(null)} className="h-10 rounded-[12px] bg-neutral-800 px-5 text-sm font-bold text-white hover:bg-neutral-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    );
}
