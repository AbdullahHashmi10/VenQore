import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    TrendingUp, DollarSign, Activity, Zap, Target, X, Loader2, Package, Users, Percent, Search,
    PieChart as PieIcon, Trophy, TrendingDown, BarChart3, Layers,
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    RangePicker, ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const RANGES = [
    { id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' },
];
const MARGINS = [
    { id: 'all', label: 'All' }, { id: 'negative', label: 'Loss (<0%)' }, { id: '0_10', label: '0% - 10%' },
    { id: '10_30', label: '10% - 30%' }, { id: '30_50', label: '30% - 50%' }, { id: '50_plus', label: '50%+' },
];
const marginOf = (r) => (r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0);
const inBand = (id, m) => (id === 'negative' ? m < 0 : id === '0_10' ? m >= 0 && m <= 10 : id === '10_30' ? m > 10 && m <= 30 : id === '30_50' ? m > 30 && m <= 50 : id === '50_plus' ? m > 50 : true);

function Modal({ children, onClose, z = 'z-50', width = 'max-w-md' }) {
    return (
        <div className={`fixed inset-0 ${z} flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl ${width}`}>{children}</div>
        </div>
    );
}

function DetailHeader({ range, filters, startDate, endDate, title, subtitle, onClose }) {
    return (
        <div className="shrink-0 bg-brand-600 p-6 text-white">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-2xs font-bold uppercase tracking-wider text-brand-100">Period: {range ? range.replace('_', ' ') : 'this year'} ({filters.start_date || startDate || 'N/A'} to {filters.end_date || endDate || 'N/A'})</span>
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="text-xs font-semibold text-brand-100">{subtitle}</p>
                </div>
                <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"><X size={20} /></button>
            </div>
        </div>
    );
}

function Statement({ revenue, profit, margin, purchase, stock, store }) {
    const rows = [
        { k: 'Revenue (net of returns)', v: formatCurrency(revenue, store) },
        { k: 'Less: Cost of Goods Sold', v: `(${formatCurrency((revenue || 0) - (profit || 0), store)})`, cls: 'text-rose-500' },
        { k: 'Gross Profit', v: formatCurrency(profit, store), cls: profit < 0 ? 'text-rose-500' : 'text-emerald-600' },
        { k: 'Gross Margin', v: `${margin.toFixed(1)}%` },
        { k: 'Purchases in period', v: formatCurrency(purchase || 0, store), cls: 'text-ink-muted' },
        { k: 'Current stock value', v: formatCurrency(stock || 0, store), cls: 'text-ink-muted' },
    ];
    return (
        <ReportTable pageSize={0} rows={rows} rowKey={(r) => r.k}
            columns={[{ key: 'k', label: 'Line' }, { key: 'v', label: 'Amount', align: 'right', render: (r) => <span className={`font-mono font-bold ${r.cls || ''}`}>{r.v}</span> }]} />
    );
}

function CustomerTable({ customers, store, tt }) {
    return (
        <ReportTable pageSize={10} rows={customers} rowKey={(r, i) => i} empty={tt('No customer-attributed purchases in this period.')}
            columns={[
                { key: 'party_name', label: tt('Customer Name'), sortable: true, render: (c) => <span className="font-bold text-ink">{c.party_name}</span> },
                { key: 'purchase_count', label: 'Times Purchased', align: 'right', sortable: true },
                { key: 'total_qty', label: 'Qty Bought', align: 'right', sortable: true },
                { key: 'total_spent', label: 'Total Spent', align: 'right', sortable: true, get: (c) => Number(c.total_spent) || 0, render: (c) => <span className="font-mono font-bold">{formatCurrency(c.total_spent, store)}</span> },
            ]} />
    );
}

export default function CategoryProfitability({ data = [], filters = {} }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [marginFilter, setMarginFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('customers');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const selectedCategoryId = urlParams.get('category_id');
    const [selectedCategory, setSelectedCategoryState] = useState(null);

    React.useEffect(() => {
        if (selectedCategoryId) {
            const found = data.find((c) => (c.category_id ?? '').toString() === selectedCategoryId);
            if (found) setSelectedCategoryState(found);
        } else {
            setSelectedCategoryState(null);
        }
    }, [selectedCategoryId, data]);

    const setSelectedCategory = (category) => {
        const url = new URL(window.location.href);
        if (category) {
            url.searchParams.set('category_id', (category.category_id ?? 'custom_index').toString());
            setSelectedCategoryState(category);
        } else {
            url.searchParams.delete('category_id');
            setSelectedCategoryState(null);
        }
        window.history.replaceState({}, '', url.toString());
    };

    const filteredCategories = useMemo(() => {
        let list = data;
        if (marginFilter !== 'all') list = list.filter((row) => inBand(marginFilter, marginOf(row)));
        if (localSearchQuery) {
            const q = localSearchQuery.toLowerCase();
            list = list.filter((row) => row.name.toLowerCase().includes(q));
        }
        return list;
    }, [data, localSearchQuery, marginFilter]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const totalRevenue = data.reduce((s, r) => s + (parseFloat(r.revenue) || 0), 0);
    const totalProfit = data.reduce((s, r) => s + (parseFloat(r.profit) || 0), 0);
    const avgMargin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const topCategory = data.reduce((prev, cur) => ((cur.profit || 0) > (prev.profit || 0) ? cur : prev), { name: '-', profit: 0 });
    const totalStockValue = data.reduce((s, r) => s + (r.stock_value || 0), 0);
    const lossCount = data.filter((r) => (r.profit || 0) < 0).length;

    const byProfit = useMemo(() => [...data].sort((a, b) => (b.profit || 0) - (a.profit || 0)), [data]);
    const profitBars = byProfit.slice(0, 8).map((r) => ({ label: r.name, value: r.profit || 0, sub: `${marginOf(r).toFixed(1)}%` }));
    const pieData = byProfit.slice(0, 5).filter((r) => (r.profit || 0) > 0).map((r) => ({ name: r.name, value: r.profit }));
    const revProfit = byProfit.slice(0, 10);
    const buckets = MARGINS.slice(1).map((m) => ({ x: m.label, y: data.filter((r) => inBand(m.id, marginOf(r))).length }));

    const go = (params) => router.get(route('store.reports.item-category-wise-profit-loss', { store_slug: store.slug }), params, { preserveState: true, preserveScroll: true });
    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            const params = new URLSearchParams(window.location.search);
            params.set('range', r); params.delete('start_date'); params.delete('end_date');
            go(Object.fromEntries(params.entries()));
        }
    };
    const applyCustomRange = () => {
        const params = new URLSearchParams(window.location.search);
        params.set('range', 'custom'); params.set('start_date', startDate); params.set('end_date', endDate);
        go(Object.fromEntries(params.entries()));
    };

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const insights = [];
            const sorted = [...data].sort((a, b) => (b.profit || 0) - (a.profit || 0));
            const top20Count = Math.ceil(data.length * 0.2);
            const top20Profit = sorted.slice(0, top20Count).reduce((s, i) => s + (i.profit || 0), 0);
            const paretoRatio = totalProfit ? (top20Profit / totalProfit) * 100 : 0;
            if (paretoRatio > 70) insights.push({ type: 'warning', title: 'High Dependency', text: `${paretoRatio.toFixed(0)}% of your category profits come from just ${top20Count} categories. Balance your offerings.` });
            else insights.push({ type: 'success', title: 'Balanced Portfolio', text: 'Profit is healthily distributed across your categories.' });
            const lossMakers = data.filter((i) => (i.profit || 0) < 0);
            if (lossMakers.length > 0) insights.push({ type: 'danger', title: 'Bleeding Categories', text: `${lossMakers.length} product categories are generating net losses. Review category pricing or COGS structure.`, categories: lossMakers.map((i) => ({ id: i.category_id, name: i.name, value: i.profit })) });
            const lowMarginHighVol = data.filter((i) => ((i.profit || 0) / (i.revenue || 1)) < 0.05 && (i.revenue || 0) > (totalRevenue / (data.length || 1)));
            if (lowMarginHighVol.length > 0) insights.push({ type: 'opportunity', title: 'Category Pricing Opportunity', text: `${lowMarginHighVol.length} high-revenue categories have net margins below 5%. Consider markup review.`, categories: lowMarginHighVol.map((i) => ({ id: i.category_id, name: i.name, value: i.profit })) });
            let score = 100;
            if (paretoRatio > 70) score -= 10;
            if (lossMakers.length > 0) { score -= 15; score -= lossMakers.length * 5; }
            if (lowMarginHighVol.length > 0) score -= lowMarginHighVol.length * 3;
            setAnalysisResult({ score: Math.max(0, Math.min(100, score)), insights });
            setIsAnalyzing(false);
        }, 1500);
    };

    const columns = [
        { key: 'name', label: 'Category Name', sortable: true, render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
        { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, get: (r) => Number(r.revenue) || 0, render: (r) => formatCurrency(r.revenue || 0, store) },
        { key: 'profit', label: 'Profit', align: 'right', sortable: true, get: (r) => Number(r.profit) || 0, render: (r) => <span className={`font-bold ${(r.profit || 0) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(r.profit || 0, store)}</span> },
        { key: 'margin', label: 'Margin', align: 'right', sortable: true, get: (r) => Number(marginOf(r).toFixed(1)), render: (r) => `${marginOf(r).toFixed(1)}%` },
        { key: 'stock_value', label: 'Stock Value', align: 'right', sortable: true, get: (r) => Number(r.stock_value) || 0, render: (r) => formatCurrency(r.stock_value || 0, store) },
        { key: 'go', label: '', align: 'right', render: () => <span className="text-xs font-bold text-brand-500">Details &rarr;</span> },
    ];

    const periodBar = (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-app p-2">
            <span className="px-2 text-xs font-bold uppercase text-ink-muted">Change period</span>
            <RangePicker value={range} onChange={handleRangeChange} options={RANGES} />
            {range === 'custom' && (
                <>
                    <DateRangeFilter presets={false} from={startDate} to={endDate} onChange={({ from, to }) => { setStartDate(from); setEndDate(to); }} />
                    <button type="button" onClick={applyCustomRange} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Apply</button>
                </>
            )}
        </div>
    );

    const filtersNode = (
        <>
            <RangePicker value={range} onChange={handleRangeChange} options={RANGES} />
            {range === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangeFilter presets={false} from={startDate} to={endDate} onChange={({ from, to }) => { setStartDate(from); setEndDate(to); }} />
                    <button type="button" onClick={applyCustomRange} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Apply</button>
                </div>
            )}
        </>
    );

    return (
        <ReportShell
            title="Category Profitability" subtitle={tt('Product category profitability analysis')} activeKey="item-category-wise-profit-loss"
            filters={filtersNode}
            actions={(
                <button type="button" onClick={runAnalysis} disabled={isAnalyzing}
                    className="flex h-10 items-center gap-2 rounded-[12px] bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-50">
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
                </button>
            )}
            exportConfig={{
                filename: 'category-profitability',
                columns: [
                    { label: 'Category', get: (r) => r.name }, { label: 'Revenue', get: (r) => r.revenue },
                    { label: 'Profit', get: (r) => r.profit }, { label: 'Margin %', get: (r) => marginOf(r).toFixed(1) },
                    { label: 'Stock Value', get: (r) => r.stock_value || 0 },
                ],
                rows: filteredCategories,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Revenue', value: formatCurrency(totalRevenue, store), sub: `${data.length} categories`, icon: DollarSign, tone: 'blue' },
                { label: 'Total Profit', value: formatCurrency(totalProfit, store), icon: TrendingUp, tone: totalProfit >= 0 ? 'emerald' : 'rose', valueTone: totalProfit >= 0 ? 'emerald' : 'rose' },
                { label: 'Avg Margin', value: `${avgMargin}%`, icon: Percent, tone: 'violet' },
                { label: 'Top Category', value: (topCategory.name || '-').substring(0, 18), sub: formatCurrency(topCategory.profit || 0, store), icon: Target, tone: 'brand' },
                { label: 'Total Stock Value', value: formatCurrency(totalStockValue, store), sub: 'Across all categories', icon: Package, tone: 'amber' },
                { label: 'Loss-making', value: lossCount, sub: 'Categories below 0%', icon: TrendingDown, tone: 'rose', valueTone: lossCount ? 'rose' : undefined },
            ]} />

            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Profit by category" subtitle="Top 8 categories" icon={Trophy} tone="emerald">
                        <RankBars items={profitBars} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Revenue vs profit" subtitle="Top 10 categories by profit" icon={BarChart3} tone="blue">
                        <TrendChart type="bar" height={260}
                            series={[
                                { name: 'Revenue', points: revProfit.map((r) => ({ x: r.name, y: Number(r.revenue) || 0 })) },
                                { name: 'Profit', points: revProfit.map((r) => ({ x: r.name, y: Number(r.profit) || 0 })) },
                            ]} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Profit contribution" subtitle="Top 5 categories" icon={PieIcon} tone="amber">
                        <DonutChart slices={pieData} height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Margin distribution" subtitle="Categories per margin band" icon={Layers} tone="violet">
                        <TrendChart type="bar" unit="integer" label="Categories" points={buckets} height={240} legend={false} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Category breakdown" subtitle={`${filteredCategories.length} of ${data.length} categories`} icon={Layers} tone="sky" flush
                right={(
                    <label className="relative block">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input type="text" placeholder="Search categories..." value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} className={`${filterInputCls} w-40 pl-8 sm:w-56`} />
                    </label>
                )}>
                <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
                    <span className="mr-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Margins</span>
                    {MARGINS.map((o) => (
                        <button key={o.id} type="button" onClick={() => setMarginFilter(o.id)}
                            className={`h-10 rounded-[12px] px-3 text-sm font-semibold transition-colors ${marginFilter === o.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>{o.label}</button>
                    ))}
                </div>
                <ReportTable columns={columns} rows={filteredCategories} rowKey={(r, i) => r.category_id ?? i} onRowClick={setSelectedCategory} />
            </ReportSection>

            {analysisResult && (
                <Modal onClose={() => setAnalysisResult(null)}>
                    <div className="bg-brand-600 p-6 text-white">
                        <div className="mb-2 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/20"><Activity size={22} /></div>
                            <button type="button" onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Category Intelligence</h2>
                        <p className="text-sm font-medium text-brand-200">Efficiency Score: <span className="font-bold text-white">{analysisResult.score.toFixed(0)}/100</span></p>
                    </div>
                    <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-4">
                        {analysisResult.insights.map((insight, idx) => {
                            const tone = { danger: 'border-rose-600 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100', warning: 'border-amber-600 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100', success: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100', opportunity: 'border-brand-600 bg-brand-50 dark:bg-brand-950/20 text-brand-900 dark:text-brand-100' }[insight.type] || 'border-line bg-app text-ink';
                            return (
                                <div key={idx} className={`rounded-[12px] border-l-4 p-4 ${tone}`}>
                                    <h4 className="mb-1 text-sm font-bold">{insight.title}</h4>
                                    <p className="mb-2 text-xs opacity-90">{insight.text}</p>
                                    {insight.categories && insight.categories.length > 0 && (
                                        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-[12px] border border-line bg-surface p-2">
                                            {insight.categories.map((c, ci) => (
                                                <button key={ci} type="button" onClick={() => { setAnalysisResult(null); setSelectedCategory(data.find((d) => d.category_id === c.id) || data.find((d) => d.name === c.name)); }}
                                                    className="flex h-10 w-full items-center justify-between rounded-[12px] px-2 text-left text-xs font-semibold text-ink hover:bg-interactive-hover">
                                                    <span className="truncate pr-4 underline">{c.name}</span>
                                                    <span className="shrink-0 font-mono font-bold">{formatCurrency(c.value, store)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end border-t border-line bg-app p-4">
                        <button type="button" onClick={() => setAnalysisResult(null)} className="h-10 rounded-[12px] bg-neutral-800 px-4 text-sm font-bold text-white hover:bg-neutral-700">Dismiss</button>
                    </div>
                </Modal>
            )}

            {selectedCategory && (() => {
                const c = data.find((x) => (x.category_id ?? '').toString() === (selectedCategory.category_id ?? '').toString()) || selectedCategory;
                const margin = marginOf(c);
                const products = c.products || [];
                return (
                    <Modal onClose={() => setSelectedCategory(null)} width="max-w-6xl w-[92vw]">
                        <DetailHeader range={range} filters={filters} startDate={startDate} endDate={endDate} title={c.name} subtitle={<>Category ID: <span className="font-bold text-white">{c.category_id || 'N/A'}</span></>} onClose={() => setSelectedCategory(null)} />
                        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                            {periodBar}
                            <ReportKpis items={[
                                { label: 'Revenue in period', value: formatCurrency(c.revenue, store), icon: DollarSign, tone: 'blue' },
                                { label: 'Profit in period', value: formatCurrency(c.profit, store), icon: TrendingUp, tone: c.profit < 0 ? 'rose' : 'emerald', valueTone: c.profit < 0 ? 'rose' : 'emerald' },
                                { label: 'Profit margin', value: `${margin.toFixed(1)}%`, icon: Percent, tone: 'brand' },
                            ]} />
                            <ReportGrid>
                                <ReportCol span={5}>
                                    <ReportSection title="Profit & Loss statement" icon={DollarSign} flush>
                                        <Statement revenue={c.revenue} profit={c.profit} margin={margin} purchase={c.purchase_cost} stock={c.stock_value} store={store} />
                                    </ReportSection>
                                </ReportCol>
                                <ReportCol span={7}>
                                    <ReportSection flush
                                        title={activeTab === 'customers' ? tt('Customer Detail') : `${tt('Products')} (${products.length})`}
                                        icon={activeTab === 'customers' ? Users : Package} tone="violet"
                                        right={(
                                            <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => setActiveTab('customers')} className={`h-10 rounded-[12px] px-3 text-sm font-semibold ${activeTab === 'customers' ? 'bg-brand-50 text-brand-700' : 'text-ink-secondary hover:bg-interactive-hover'}`}>{tt('Customer Detail')}</button>
                                                <button type="button" onClick={() => setActiveTab('products')} className={`h-10 rounded-[12px] px-3 text-sm font-semibold ${activeTab === 'products' ? 'bg-brand-50 text-brand-700' : 'text-ink-secondary hover:bg-interactive-hover'}`}>{tt('Products')}</button>
                                            </div>
                                        )}>
                                        {activeTab === 'customers' ? (
                                            <CustomerTable customers={c.customers || []} store={store} tt={tt} />
                                        ) : (
                                            <ReportTable pageSize={10} rows={products} rowKey={(r, i) => i} onRowClick={setSelectedProduct} empty={tt('No products found with sales in this category during the period.')}
                                                columns={[
                                                    { key: 'name', label: tt('Product Name'), sortable: true, render: (p) => <span className="font-bold text-ink">{p.name}</span> },
                                                    { key: 'quantity', label: 'Qty Sold', align: 'right', sortable: true },
                                                    { key: 'net_revenue', label: 'Revenue', align: 'right', sortable: true, get: (p) => Number(p.net_revenue) || 0, render: (p) => <span className="font-mono">{formatCurrency(p.net_revenue, store)}</span> },
                                                    { key: 'gross_profit', label: 'Profit', align: 'right', sortable: true, get: (p) => Number(p.gross_profit) || 0, render: (p) => <span className={`font-mono font-bold ${p.gross_profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(p.gross_profit, store)}</span> },
                                                    { key: 'margin', label: 'Margin', align: 'right', sortable: true, get: (p) => (p.net_revenue > 0 ? (p.gross_profit / p.net_revenue) * 100 : 0), render: (p) => { const m = p.net_revenue > 0 ? (p.gross_profit / p.net_revenue) * 100 : 0; return <span className={`font-bold ${m > 20 ? 'text-emerald-600' : m > 0 ? 'text-amber-600' : 'text-rose-600'}`}>{m.toFixed(1)}%</span>; } },
                                                ]} />
                                        )}
                                    </ReportSection>
                                </ReportCol>
                            </ReportGrid>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-line bg-app p-4">
                            <button type="button" onClick={() => setSelectedCategory(null)} className="h-10 rounded-[12px] bg-neutral-800 px-5 text-sm font-bold text-white hover:bg-neutral-700">Close</button>
                        </div>
                    </Modal>
                );
            })()}

            {selectedProduct && (() => {
                const p = selectedProduct;
                const margin = p.net_revenue > 0 ? (p.gross_profit / p.net_revenue) * 100 : 0;
                return (
                    <Modal z="z-[60]" onClose={() => setSelectedProduct(null)} width="max-w-6xl w-[92vw]">
                        <DetailHeader range={range} filters={filters} startDate={startDate} endDate={endDate} title={p.name} subtitle={<>SKU: <span className="font-bold text-white">{p.sku || 'N/A'}</span></>} onClose={() => setSelectedProduct(null)} />
                        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                            <ReportKpis items={[
                                { label: 'Revenue in period', value: formatCurrency(p.net_revenue, store), icon: DollarSign, tone: 'blue' },
                                { label: 'Profit in period', value: formatCurrency(p.gross_profit, store), icon: TrendingUp, tone: p.gross_profit < 0 ? 'rose' : 'emerald', valueTone: p.gross_profit < 0 ? 'rose' : 'emerald' },
                                { label: 'Profit margin', value: `${margin.toFixed(1)}%`, icon: Percent, tone: 'brand' },
                            ]} />
                            <ReportGrid>
                                <ReportCol span={5}>
                                    <ReportSection title="Profit & Loss statement" icon={DollarSign} flush>
                                        <Statement revenue={p.net_revenue} profit={p.gross_profit} margin={margin} purchase={p.purchase_cost} stock={p.stock_value} store={store} />
                                    </ReportSection>
                                </ReportCol>
                                <ReportCol span={7}>
                                    <ReportSection title={tt('Customer Purchase Detail')} icon={Users} tone="violet" flush>
                                        <CustomerTable customers={p.customers || []} store={store} tt={tt} />
                                    </ReportSection>
                                </ReportCol>
                            </ReportGrid>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-line bg-app p-4">
                            <button type="button" onClick={() => setSelectedProduct(null)} className="h-10 rounded-[12px] bg-neutral-800 px-5 text-sm font-bold text-white hover:bg-neutral-700">Close</button>
                        </div>
                    </Modal>
                );
            })()}
        </ReportShell>
    );
}
