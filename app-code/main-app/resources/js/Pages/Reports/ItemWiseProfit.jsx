import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    TrendingUp, DollarSign, Activity, Zap, Target, X, Loader2, Package, ChevronDown, Users, ShoppingBag,
    PieChart as PieIcon, Trophy, TrendingDown, Search, BarChart3, ListOrdered, Percent,
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    RangePicker, ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls, DateRangeFilter,
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
const marginOf = (i) => (i.revenue > 0 ? (i.profit / i.revenue) * 100 : 0);

export default function ItemWiseProfit({ items = [], filters = {}, allProducts = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [productFilter, setProductFilter] = useState(filters.product_ids || []);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [marginFilter, setMarginFilter] = useState('all');

    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const selectedProductId = urlParams.get('product_id');
    const [selectedProduct, setSelectedProductState] = useState(null);

    React.useEffect(() => {
        if (selectedProductId) {
            const found = items.find((i) => i.product_id === selectedProductId);
            if (found) setSelectedProductState(found);
        } else {
            setSelectedProductState(null);
        }
    }, [selectedProductId, items]);

    const setSelectedProduct = (item) => {
        const url = new URL(window.location.href);
        if (item) {
            url.searchParams.set('product_id', item.product_id.toString());
            setSelectedProductState(item);
        } else {
            url.searchParams.delete('product_id');
            setSelectedProductState(null);
        }
        window.history.replaceState({}, '', url.toString());
    };

    const filteredItems = useMemo(() => {
        let list = items;
        if (marginFilter !== 'all') {
            list = list.filter((item) => {
                const m = marginOf(item);
                if (marginFilter === 'negative') return m < 0;
                if (marginFilter === '0_10') return m >= 0 && m <= 10;
                if (marginFilter === '10_30') return m > 10 && m <= 30;
                if (marginFilter === '30_50') return m > 30 && m <= 50;
                if (marginFilter === '50_plus') return m > 50;
                return true;
            });
        }
        if (localSearchQuery) {
            const q = localSearchQuery.toLowerCase();
            list = list.filter((item) => item.name.toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q));
        }
        return list;
    }, [items, localSearchQuery, marginFilter]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const totalRevenue = items.reduce((s, i) => s + (parseFloat(i.revenue) || 0), 0);
    const totalProfit = items.reduce((s, i) => s + (parseFloat(i.profit) || 0), 0);
    const avgMargin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const topEarner = items.reduce((prev, cur) => (prev.profit > cur.profit ? prev : cur), { name: '-', profit: 0 });
    const lossCount = items.filter((i) => i.profit < 0).length;

    const byProfit = useMemo(() => [...items].sort((a, b) => b.profit - a.profit), [items]);
    const topItems = byProfit.slice(0, 8).map((i) => ({ label: i.name, value: i.profit, sub: `${marginOf(i).toFixed(1)}%` }));
    const bottomItems = [...byProfit].reverse().slice(0, 8).map((i) => ({ label: i.name, value: i.profit, sub: `${marginOf(i).toFixed(1)}%` }));
    const pieData = byProfit.slice(0, 5).filter((i) => i.profit > 0).map((i) => ({ name: i.name, value: i.profit }));
    const buckets = MARGINS.slice(1).map((m) => ({
        x: m.label,
        y: items.filter((i) => {
            const v = marginOf(i);
            return m.id === 'negative' ? v < 0 : m.id === '0_10' ? v >= 0 && v <= 10 : m.id === '10_30' ? v > 10 && v <= 30 : m.id === '30_50' ? v > 30 && v <= 50 : v > 50;
        }).length,
    }));

    const go = (params) => router.get(route('store.reports.item-wise-profit', { store_slug: store.slug }), params, { preserveState: true, preserveScroll: true });
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
    const toggleProductFilter = (productId) => {
        const next = productFilter.includes(productId) ? productFilter.filter((id) => id !== productId) : [...productFilter, productId];
        setProductFilter(next);
        go({ range, start_date: startDate, end_date: endDate, product_ids: next });
    };
    const clearProductFilter = () => {
        setProductFilter([]);
        go({ range, start_date: startDate, end_date: endDate, product_ids: [] });
    };

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const insights = [];
            const sorted = [...items].sort((a, b) => b.profit - a.profit);
            const top20Count = Math.ceil(items.length * 0.2);
            const top20Profit = sorted.slice(0, top20Count).reduce((s, i) => s + i.profit, 0);
            const paretoRatio = totalProfit ? (top20Profit / totalProfit) * 100 : 0;
            if (paretoRatio > 70) insights.push({ type: 'warning', title: 'High Dependency', text: `${paretoRatio.toFixed(0)}% of your profit comes from just ${top20Count} items. Diversify your best-sellers.` });
            else insights.push({ type: 'success', title: 'Balanced Portfolio', text: 'Your profit is well-distributed across your catalog.' });
            const lossMakers = items.filter((i) => i.profit < 0);
            if (lossMakers.length > 0) insights.push({ type: 'danger', title: 'Bleeding Assets', text: `${lossMakers.length} items are selling at a loss. Review pricing immediately.`, products: lossMakers.map((i) => ({ id: i.product_id, name: i.name, value: i.profit })) });
            const lowMarginHighVol = items.filter((i) => (i.profit / i.revenue) < 0.05 && i.revenue > (totalRevenue / items.length));
            if (lowMarginHighVol.length > 0) insights.push({ type: 'opportunity', title: 'Price Optimization', text: `${lowMarginHighVol.length} high-volume items have margins below 5%. A small price increase here creates massive pure profit.`, products: lowMarginHighVol.map((i) => ({ id: i.product_id, name: i.name, value: i.profit })) });
            let score = 100;
            if (paretoRatio > 70) score -= 10;
            if (lossMakers.length > 0) { score -= 15; score -= lossMakers.length * 5; }
            if (lowMarginHighVol.length > 0) score -= lowMarginHighVol.length * 3;
            setAnalysisResult({ score: Math.max(0, Math.min(100, score)), insights });
            setIsAnalyzing(false);
        }, 1500);
    };

    const columns = [
        { key: 'name', label: tt('Product Name'), sortable: true, render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
        { key: 'sku', label: 'SKU', sortable: true, render: (r) => r.sku || '-' },
        { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, get: (r) => Number(r.revenue) || 0, render: (r) => formatCurrency(r.revenue || 0, store) },
        { key: 'profit', label: 'Profit', align: 'right', sortable: true, get: (r) => Number(r.profit) || 0, render: (r) => <span className={`font-bold ${r.profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(r.profit || 0, store)}</span> },
        { key: 'margin', label: 'Margin', align: 'right', sortable: true, get: (r) => Number(marginOf(r).toFixed(1)), render: (r) => `${marginOf(r).toFixed(1)}%` },
        { key: 'go', label: '', align: 'right', render: () => <span className="text-xs font-bold text-brand-500">Details &rarr;</span> },
    ];

    const filtersNode = (
        <>
            <ProductMultiSelect allProducts={allProducts} selected={productFilter} onToggle={toggleProductFilter} />
            <RangePicker value={range} onChange={handleRangeChange} options={RANGES} />
            {range === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangeFilter presets={false} from={startDate} to={endDate} onChange={({ from, to }) => { setStartDate(from); setEndDate(to); }} />
                    <button type="button" onClick={applyCustomRange} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Apply</button>
                </div>
            )}
            {productFilter.length > 0 && (
                <button type="button" onClick={clearProductFilter} className="h-10 rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">Clear {productFilter.length} product filter(s)</button>
            )}
        </>
    );

    return (
        <ReportShell
            title="Profit by Item" subtitle={tt('Product-level profitability analysis')} activeKey="item-wise-profit"
            filters={filtersNode}
            actions={(
                <button type="button" onClick={runAnalysis} disabled={isAnalyzing}
                    className="flex h-10 items-center gap-2 rounded-[12px] bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-50">
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
                </button>
            )}
            exportConfig={{
                filename: 'item-wise-profit',
                columns: [
                    { label: 'Product', get: (r) => r.name }, { label: 'SKU', get: (r) => r.sku || '' },
                    { label: 'Revenue', get: (r) => r.revenue }, { label: 'Profit', get: (r) => r.profit },
                    { label: 'Margin %', get: (r) => marginOf(r).toFixed(1) },
                ],
                rows: filteredItems,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Revenue', value: formatCurrency(totalRevenue, store), sub: `${items.length} items sold`, icon: DollarSign, tone: 'blue' },
                { label: 'Total Profit', value: formatCurrency(totalProfit, store), icon: TrendingUp, tone: totalProfit >= 0 ? 'emerald' : 'rose', valueTone: totalProfit >= 0 ? 'emerald' : 'rose' },
                { label: 'Avg Margin', value: `${avgMargin}%`, icon: Percent, tone: 'violet' },
                { label: 'Top Earner', value: String(topEarner.name).substring(0, 18), sub: formatCurrency(topEarner.profit, store), icon: Target, tone: 'brand' },
                { label: 'Active Catalog', value: items.length, sub: 'Items with sales', icon: Package, tone: 'amber' },
                { label: 'Loss-making', value: lossCount, sub: 'Items below 0% margin', icon: TrendingDown, tone: 'rose', valueTone: lossCount ? 'rose' : undefined },
            ]} />

            <ReportGrid>
                <ReportCol span={6}>
                    <ReportSection title="Top items by profit" subtitle="Highest earners" icon={Trophy} tone="emerald">
                        <RankBars items={topItems} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={6}>
                    <ReportSection title="Bottom items by profit" subtitle="Lowest earners and losses" icon={TrendingDown} tone="rose">
                        <RankBars items={bottomItems} colorIndex={3} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Margin distribution" subtitle="Number of items per margin band" icon={BarChart3} tone="violet">
                        <TrendChart type="bar" unit="integer" label="Items" points={buckets} height={240} legend={false} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Profit contribution" subtitle="Top 5 items" icon={PieIcon} tone="amber">
                        <DonutChart slices={pieData} height={240} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Item breakdown" subtitle={`${filteredItems.length} of ${items.length} items`} icon={ListOrdered} tone="sky" flush
                right={(
                    <label className="relative block">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input type="text" placeholder="Search items..." value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} className={`${filterInputCls} w-40 pl-8 sm:w-56`} />
                    </label>
                )}>
                <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
                    <span className="mr-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Margins</span>
                    {MARGINS.map((o) => (
                        <button key={o.id} type="button" onClick={() => setMarginFilter(o.id)}
                            className={`h-10 rounded-[12px] px-3 text-sm font-semibold transition-colors ${marginFilter === o.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>{o.label}</button>
                    ))}
                </div>
                <ReportTable columns={columns} rows={filteredItems} rowKey={(r, i) => r.product_id || i} onRowClick={setSelectedProduct} empty="No products found matching the search." />
            </ReportSection>

            {analysisResult && (
                <Modal onClose={() => setAnalysisResult(null)} width="max-w-md">
                    <div className="bg-brand-600 p-6 text-white">
                        <div className="mb-2 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/20"><Activity size={22} /></div>
                            <button type="button" onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Catalog Intelligence</h2>
                        <p className="text-sm font-medium text-brand-200">Efficiency Score: <span className="font-bold text-white">{analysisResult.score.toFixed(0)}/100</span></p>
                    </div>
                    <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-4">
                        {analysisResult.insights.map((insight, idx) => {
                            const tone = { danger: 'border-rose-600 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100', warning: 'border-amber-600 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100', success: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100', opportunity: 'border-brand-600 bg-brand-50 dark:bg-brand-950/20 text-brand-900 dark:text-brand-100' }[insight.type] || 'border-line bg-app text-ink';
                            return (
                                <div key={idx} className={`rounded-[12px] border-l-4 p-4 ${tone}`}>
                                    <h4 className="mb-1 text-sm font-bold">{insight.title}</h4>
                                    <p className="mb-2 text-xs opacity-90">{insight.text}</p>
                                    {insight.products && insight.products.length > 0 && (
                                        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-[12px] border border-line bg-surface p-2">
                                            {insight.products.map((p) => (
                                                <button key={p.id} type="button" onClick={() => { setAnalysisResult(null); setSelectedProduct(items.find((i) => i.product_id === p.id)); }}
                                                    className="flex h-10 w-full items-center justify-between rounded-[12px] px-2 text-left text-xs font-semibold text-ink hover:bg-interactive-hover">
                                                    <span className="truncate pr-4 underline">{p.name}</span>
                                                    <span className="shrink-0 font-mono font-bold">{formatCurrency(p.value, store)}</span>
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

            {selectedProduct && (() => {
                const p = items.find((i) => i.product_id === selectedProduct.product_id) || selectedProduct;
                const margin = marginOf(p);
                const customers = p.customers || [];
                return (
                    <Modal onClose={() => setSelectedProduct(null)} width="max-w-6xl w-[92vw]">
                        <div className="shrink-0 bg-brand-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-2xs font-bold uppercase tracking-wider text-brand-100">Period: {range ? range.replace('_', ' ') : 'this year'} ({filters.start_date || startDate || 'N/A'} to {filters.end_date || endDate || 'N/A'})</span>
                                    <h2 className="text-2xl font-bold tracking-tight">{p.name}</h2>
                                    <p className="text-xs font-semibold text-brand-100">SKU: <span className="font-bold text-white">{p.sku || 'N/A'}</span></p>
                                </div>
                                <button type="button" onClick={() => setSelectedProduct(null)} className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
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
                            <ReportKpis items={[
                                { label: 'Revenue in period', value: formatCurrency(p.revenue, store), icon: DollarSign, tone: 'blue' },
                                { label: 'Profit in period', value: formatCurrency(p.profit, store), icon: TrendingUp, tone: p.profit < 0 ? 'rose' : 'emerald', valueTone: p.profit < 0 ? 'rose' : 'emerald' },
                                { label: 'Profit margin', value: `${margin.toFixed(1)}%`, icon: Percent, tone: 'brand' },
                            ]} />
                            <ReportGrid>
                                <ReportCol span={5}>
                                    <ReportSection title="Profit & Loss statement" icon={DollarSign} flush>
                                        <ReportTable pageSize={0} rowKey={(r) => r.k}
                                            columns={[{ key: 'k', label: 'Line' }, { key: 'v', label: 'Amount', align: 'right', render: (r) => <span className={`font-mono font-bold ${r.cls || ''}`}>{r.v}</span> }]}
                                            rows={[
                                                { k: 'Revenue (net of returns)', v: formatCurrency(p.revenue, store) },
                                                { k: 'Less: Cost of Goods Sold', v: `(${formatCurrency((p.revenue || 0) - (p.profit || 0), store)})`, cls: 'text-rose-500' },
                                                { k: 'Gross Profit', v: formatCurrency(p.profit, store), cls: p.profit < 0 ? 'text-rose-500' : 'text-emerald-600' },
                                                { k: 'Gross Margin', v: `${margin.toFixed(1)}%` },
                                                { k: 'Purchases in period', v: formatCurrency(p.purchase_cost || 0, store), cls: 'text-ink-muted' },
                                                { k: 'Current stock value', v: formatCurrency(p.stock_value || 0, store), cls: 'text-ink-muted' },
                                            ]} />
                                    </ReportSection>
                                </ReportCol>
                                <ReportCol span={7}>
                                    <ReportSection title={tt('Customer Purchase Detail')} icon={Users} tone="violet" flush>
                                        <ReportTable pageSize={10} rows={customers} rowKey={(r, i) => i} empty={tt('No customer-attributed purchases in this period.')}
                                            columns={[
                                                { key: 'party_name', label: tt('Customer Name'), sortable: true, render: (c) => <span className="font-bold text-ink">{c.party_name}</span> },
                                                { key: 'purchase_count', label: 'Times Purchased', align: 'right', sortable: true },
                                                { key: 'total_qty', label: 'Qty Bought', align: 'right', sortable: true },
                                                { key: 'total_spent', label: 'Total Spent', align: 'right', sortable: true, get: (c) => Number(c.total_spent) || 0, render: (c) => <span className="font-mono font-bold">{formatCurrency(c.total_spent, store)}</span> },
                                            ]} />
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

function Modal({ children, onClose, width = 'max-w-md' }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl ${width}`}>{children}</div>
        </div>
    );
}

function ProductMultiSelect({ allProducts, selected, onToggle }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const tt = useTermText();
    const filtered = query === ''
        ? allProducts.slice(0, 50)
        : allProducts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku || '').toLowerCase().includes(query.toLowerCase())).slice(0, 50);

    return (
        <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 items-center gap-2 rounded-[12px] border border-line bg-app px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
                <ShoppingBag size={14} />
                {selected.length > 0 ? `${selected.length} ${tt('Product(s)')}` : tt('All Products')}
                <ChevronDown size={12} />
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-[14px] border border-line bg-surface shadow-xl">
                    <div className="border-b border-line p-2">
                        <input type="text" autoFocus placeholder={tt('Search products...')} value={query} onChange={(e) => setQuery(e.target.value)} className={`${filterInputCls} w-full`} />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <p className="py-4 text-center text-xs text-ink-muted">{tt('No products found')}</p>
                        ) : filtered.map((p) => (
                            <label key={p.id} className="flex h-10 cursor-pointer items-center gap-2 rounded-[12px] px-3 text-sm hover:bg-interactive-hover">
                                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => onToggle(p.id)} className="rounded border-line text-brand-600 focus:ring-brand-500" />
                                <span className="truncate text-ink-secondary">{p.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end border-t border-line p-2">
                        <button type="button" onClick={() => setIsOpen(false)} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
}
