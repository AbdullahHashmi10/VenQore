import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, Users, DollarSign, Award, Clock, ShoppingBag, X, Zap, Trophy, BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, FilterSelect, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const RANGES = [
    { value: 'today', label: 'Today' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
];

export default function CustomerInsights({ data = [], stats = [], filters = {} }) {
    const tt = useTermText();
    const { store } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalDetails, setModalDetails] = useState({ invoices: [], top_items: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const go = (params) => router.get(route('store.reports.customer-insights', { store_slug: store.slug }),
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

    const applyCustomRange = (from, to) => {
        const params = new URLSearchParams(window.location.search);
        params.set('range', 'custom');
        params.set('start_date', from);
        params.set('end_date', to);
        go(Object.fromEntries(params.entries()));
    };

    const onDates = ({ from, to }) => {
        setStartDate(from || '');
        setEndDate(to || '');
        setRange('custom');
        if (from && to) applyCustomRange(from, to);
    };

    const filtered = useMemo(() => data.filter((c) =>
        !search ||
        (c.party_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.favorite_category || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.most_bought_item || '').toLowerCase().includes(search.toLowerCase())), [data, search]);

    const byRevenue = useMemo(() => [...data].sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0)), [data]);
    const vipCustomers = byRevenue.slice(0, 3);

    const categorySlices = useMemo(() => {
        const m = {};
        data.forEach((c) => { const k = c.favorite_category || 'N/A'; m[k] = (m[k] || 0) + (c.total_spend || 0); });
        return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [data]);

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        if (!customer) { setModalDetails({ invoices: [], top_items: [] }); return; }
        setIsLoadingDetails(true);
        fetch(route('store.reports.customer-insights.details', {
            store_slug: store.slug,
            party_id: customer.party_id,
            start_date: filters.start_date || startDate,
            end_date: filters.end_date || endDate,
        }))
            .then((res) => res.json())
            .then((json) => {
                setModalDetails({ invoices: json.invoices || [], top_items: json.top_items || [] });
                setIsLoadingDetails(false);
            })
            .catch((err) => { console.error(err); setIsLoadingDetails(false); });
    };

    const kpis = stats.map((s) => {
        let tone = 'brand'; let icon = DollarSign; let prefix = '';
        if (s.label.includes('Revenue')) { tone = 'emerald'; prefix = '$ '; }
        if (s.label.includes('Spend / Customer')) { tone = 'blue'; prefix = '$ '; }
        if (s.label.includes('Customers')) icon = Users;
        return { label: s.label, value: `${prefix}${s.value}`, icon, tone };
    });

    const columns = [
        { key: 'party_name', label: tt('Customer'), sortable: true, get: (r) => r.party_name || '',
            render: (r) => (
                <span className="flex flex-col leading-tight">
                    <span className="font-bold text-ink">{r.party_name}</span>
                    <span className="font-mono text-2xs text-ink-muted">Last Active: {r.last_purchase_at || 'N/A'}</span>
                </span>
            ) },
        { key: 'invoice_count', label: 'Invoices', align: 'right', sortable: true, get: (r) => r.invoice_count || 0 },
        { key: 'total_spend', label: 'Total Spent', align: 'right', sortable: true, get: (r) => r.total_spend || 0, render: (r) => <span className="font-bold text-ink">{formatCurrency(r.total_spend, store)}</span> },
        { key: 'avg_invoice_value', label: 'Avg Invoice', align: 'right', sortable: true, get: (r) => r.avg_invoice_value || 0, render: (r) => formatCurrency(r.avg_invoice_value, store) },
        { key: 'favorite_category', label: 'Favourite Category', sortable: true, get: (r) => r.favorite_category || 'N/A',
            render: (r) => <span className="inline-flex items-center gap-1 font-bold text-brand-600"><Award size={12} />{r.favorite_category || 'N/A'}</span> },
        { key: 'most_bought_item', label: 'Top Item', get: (r) => r.most_bought_item || 'N/A' },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                <input type="text" placeholder={tt('Search customer patterns...')} value={search} onChange={(e) => setSearch(e.target.value)}
                    className={`${filterInputCls} w-64 pl-9`} />
            </div>
            <FilterSelect label="Period" value={range} onChange={handleRangeChange} options={RANGES} />
            <DateRangeFilter from={startDate} to={endDate} onChange={onDates} presets={false} />
        </>
    );

    return (
        <ReportShell
            title={tt('Customer Insights')}
            subtitle="Real-time cohort spend tracking and favorite category patterns"
            filters={filterNode}
            exportConfig={{
                filename: 'customer-insights',
                columns: [
                    { label: tt('Customer'), get: (r) => r.party_name },
                    { label: 'Invoices', get: (r) => r.invoice_count },
                    { label: 'Total Spent', get: (r) => r.total_spend },
                    { label: 'Avg Invoice', get: (r) => r.avg_invoice_value },
                    { label: 'Favourite Category', get: (r) => r.favorite_category },
                    { label: 'Top Item', get: (r) => r.most_bought_item },
                    { label: 'Last Active', get: (r) => r.last_purchase_at },
                ],
                rows: filtered,
            }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title={tt('Top Customer Contribution')} subtitle="Total spend in period" icon={BarChart2}>
                        <RankBars items={byRevenue.map((c) => ({ label: c.party_name || '', value: c.total_spend || 0, sub: `${c.invoice_count || 0} invoices` }))} unit="currency" limit={8} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Revenue by favourite category" icon={Award} tone="violet">
                        <DonutChart slices={categorySlices} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Cohort intelligence" subtitle="Top spenders (VIP cluster). Click one to open the full invoice log" icon={Zap} tone="emerald">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {vipCustomers.length === 0 ? <p className="text-sm text-ink-muted">No customers in this period.</p> : vipCustomers.map((c, idx) => (
                        <button key={idx} type="button" onClick={() => handleSelectCustomer(c)}
                            className="flex h-14 items-center justify-between gap-2 rounded-[12px] border border-line bg-app px-3 text-left transition-colors hover:border-brand-300">
                            <span className="flex min-w-0 items-center gap-2">
                                <Trophy size={16} className="shrink-0 text-amber-500" />
                                <span className="truncate text-sm font-bold text-ink">{c.party_name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-sm font-bold text-emerald-600">{formatCurrency(c.total_spend, store)}</span>
                        </button>
                    ))}
                </div>
            </ReportSection>

            <ReportSection title={tt('Customer Loyalty Registry')} subtitle={`${filtered.length} customers. Click a row for the invoice log`} flush>
                <ReportTable columns={columns} rows={filtered} rowKey={(r, i) => r.party_id || i} onRowClick={handleSelectCustomer} empty={tt('No customer insights found.')} />
            </ReportSection>

            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-2xs font-bold uppercase tracking-wider text-brand-600">Spender Profile Analysis</p>
                                <h2 className="truncate text-lg font-bold text-ink">{selectedCustomer.party_name}</h2>
                                <p className="text-xs text-ink-muted">Last Active Purchase: <span className="font-bold text-ink-secondary">{selectedCustomer.last_purchase_at || 'N/A'}</span></p>
                            </div>
                            <button type="button" onClick={() => handleSelectCustomer(null)} className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-muted hover:bg-interactive-hover"><X size={18} /></button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                            <ReportKpis min={200} items={[
                                { label: 'Total Spent in Period', value: formatCurrency(selectedCustomer.total_spend, store), icon: DollarSign, tone: 'brand' },
                                { label: 'Invoices Registered', value: selectedCustomer.invoice_count, icon: Clock, tone: 'sky' },
                                { label: 'Average Ticket Value', value: formatCurrency(selectedCustomer.avg_invoice_value, store), icon: Award, tone: 'emerald' },
                            ]} />
                            {isLoadingDetails ? (
                                <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">Querying Ledger...</div>
                            ) : (
                                <ReportGrid>
                                    <ReportCol span={6}>
                                        <ReportSection title="Invoice Purchase History" icon={Clock} flush>
                                            <ReportTable pageSize={10} empty="No invoice transaction logs found in this period." rows={modalDetails.invoices}
                                                columns={[
                                                    { key: 'date', label: 'Date', render: (r) => <span className="font-mono text-ink-muted">{r.date}</span> },
                                                    { key: 'invoice_no', label: 'Invoice No', render: (r) => <span className="font-semibold">{r.invoice_no} <span className={`ml-1 rounded-[12px] px-1.5 text-4xs font-bold uppercase ${r.status === 'posted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{r.status}</span></span> },
                                                    { key: 'amount', label: 'Amount', align: 'right', render: (r) => <span className="font-bold text-ink">{formatCurrency(r.amount, store)}</span> },
                                                ]} />
                                        </ReportSection>
                                    </ReportCol>
                                    <ReportCol span={6}>
                                        <ReportSection title={tt('Product Buying Preferences')} icon={ShoppingBag} tone="violet" flush>
                                            <ReportTable pageSize={10} empty={tt('No products purchases found.')} rows={modalDetails.top_items}
                                                columns={[
                                                    { key: 'name', label: tt('Product'), render: (r) => <span className="font-bold text-ink">{r.name} <span className="font-mono text-3xs font-normal text-ink-muted">{r.sku}</span></span> },
                                                    { key: 'quantity', label: 'Qty Bought', align: 'right' },
                                                    { key: 'total_spent', label: 'Total Spent', align: 'right', render: (r) => <span className="font-bold text-ink">{formatCurrency(r.total_spent, store)}</span> },
                                                ]} />
                                        </ReportSection>
                                    </ReportCol>
                                </ReportGrid>
                            )}
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-line p-2">
                            <button type="button" onClick={() => handleSelectCustomer(null)} className="h-10 rounded-[12px] bg-neutral-800 px-5 text-sm font-bold text-white hover:bg-neutral-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    );
}
