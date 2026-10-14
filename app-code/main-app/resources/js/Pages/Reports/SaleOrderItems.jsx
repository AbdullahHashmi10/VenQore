import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Package, Search, Layers, ShoppingBag, DollarSign, Tag, Receipt, TrendingUp, PieChart as PieIcon, Trophy, Hash,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function rangeDates(filters) {
    const now = new Date();
    const range = filters.range || 'this_month';
    if (range === 'today') return [ymd(now), ymd(now)];
    if (range === 'this_month') return [ymd(new Date(now.getFullYear(), now.getMonth(), 1)), ymd(now)];
    if (range === 'this_year') return [ymd(new Date(now.getFullYear(), 0, 1)), ymd(now)];
    return [filters.start_date || '', filters.end_date || ''];
}

export default function SaleOrderItems({ items = [], filters = {} }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const [searchQuery, setSearchQuery] = useState('');
    const [[from, to], setDates] = useState(() => rangeDates(filters));

    // --- Derived Data ---
    const processedItems = useMemo(() => {
        let data = [...items];
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.sales_order?.order_number || '').toString().toLowerCase().includes(lowerQ) ||
                (item.product?.name || '').toLowerCase().includes(lowerQ)
            );
        }
        data.sort((a, b) => (Number(b.quantity) * Number(b.price)) - (Number(a.quantity) * Number(a.price)));
        return data;
    }, [items, searchQuery]);

    // --- Stats ---
    const stats = useMemo(() => {
        const totalItems = processedItems.reduce((acc, curr) => acc + Number(curr.quantity), 0);
        const totalRevenue = processedItems.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price)), 0);
        const count = processedItems.length;
        const avgPrice = count > 0 ? totalRevenue / count : 0;
        const orders = new Set(processedItems.map(i => i.sales_order?.order_number)).size;
        return { totalItems, totalRevenue, avgPrice, count, orders };
    }, [processedItems]);

    // Per product: qty + revenue
    const byProduct = useMemo(() => {
        const map = {};
        processedItems.forEach(i => {
            const name = i.product?.name || 'Unknown';
            map[name] = map[name] || { qty: 0, revenue: 0 };
            map[name].qty += Number(i.quantity);
            map[name].revenue += Number(i.quantity) * Number(i.price);
        });
        return Object.entries(map).map(([name, v]) => ({ name, ...v }));
    }, [processedItems]);

    const topByQty = [...byProduct].sort((a, b) => b.qty - a.qty);
    const topByRevenue = [...byProduct].sort((a, b) => b.revenue - a.revenue);
    const topProductEntry = topByQty[0] || null;

    const daily = useMemo(() => {
        const map = {};
        processedItems.forEach(i => {
            const d = i.sales_order?.created_at;
            if (!d) return;
            const k = ymd(new Date(d));
            map[k] = (map[k] || 0) + Number(i.quantity) * Number(i.price);
        });
        return Object.keys(map).sort().map(k => ({ x: k, y: map[k] }));
    }, [processedItems]);

    const applyRange = ({ from: f, to: t }) => {
        setDates([f || '', t || '']);
        if (f && t) {
            router.get(route("store.reports.sale-order-items", {
                store_slug: store.slug
            }), { range: 'custom', start_date: f, end_date: t }, { preserveState: true, preserveScroll: true });
        }
    };

    const columns = [
        { key: 'order_number', label: tt('Order #'), sortable: true, get: (i) => `#${i.sales_order?.order_number ?? ''}`, render: (i) => <span className="font-mono font-bold text-brand-600 dark:text-brand-400">#{i.sales_order?.order_number}</span> },
        { key: 'date', label: 'Date', sortable: true, get: (i) => (i.sales_order?.created_at ? ymd(new Date(i.sales_order.created_at)) : ''), render: (i) => (i.sales_order?.created_at ? new Date(i.sales_order.created_at).toLocaleDateString() : '') },
        { key: 'product', label: tt('Product Name'), sortable: true, get: (i) => i.product?.name || tt('Unknown Product'),
            render: (i) => (
                <span className="inline-flex items-center gap-2">
                    {i.product?.name || tt('Unknown Product')}
                    {i.sales_order?.status && (
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${i.sales_order.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`} title={tt(`Order is ${i.sales_order.status}`)} />
                    )}
                </span>
            ) },
        { key: 'quantity', label: 'Qty', align: 'center', sortable: true, get: (i) => Number(i.quantity) || 0, render: (i) => formatNumber(i.quantity) },
        { key: 'price', label: 'Price', align: 'right', sortable: true, get: (i) => Number(i.price) || 0, render: (i) => formatCurrency(i.price, store) },
        { key: 'subtotal', label: 'Total', align: 'right', sortable: true, get: (i) => Number(i.quantity) * Number(i.price), render: (i) => <span className="font-bold tabular-nums text-ink">{formatCurrency(i.quantity * i.price, store)}</span> },
    ];

    const kpis = [
        { label: 'Total Items Sold', value: formatNumber(stats.totalItems), icon: ShoppingBag, tone: 'violet', sub: 'Units moved' },
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue, store), icon: DollarSign, tone: 'emerald' },
        { label: 'Avg Unit Price', value: formatCurrency(stats.avgPrice, store), icon: Tag, tone: 'blue' },
        { label: 'Top Seller', value: topProductEntry ? topProductEntry.name : 'N/A', icon: Package, tone: 'amber', sub: topProductEntry ? `${formatNumber(topProductEntry.qty)} units` : undefined },
        { label: 'Line Items', value: formatNumber(stats.count), icon: Layers, tone: 'brand' },
        { label: 'Orders', value: formatNumber(stats.orders), icon: Hash, tone: 'sky' },
    ];

    const filterNode = (
        <>
            <DateRangeFilter from={from} to={to} onChange={applyRange} />
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={14} />
                <input type="text" placeholder={tt('Search Item or Order #...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${filterInputCls} w-64 pl-9`} />
            </div>
        </>
    );

    return (
        <ReportShell
            title={tt('Order Items Report')}
            subtitle={tt('Product performance in sales orders')}
            filters={filterNode}
            exportConfig={{ filename: 'sales-order-items', columns: columns.map((c) => ({ label: c.label, get: c.get })), rows: processedItems }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Item Revenue Trend" subtitle="Value of items ordered per day" icon={TrendingUp} tone="emerald">
                        <TrendChart points={daily} label="Item revenue" type="area" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Top Revenue Generators" subtitle="Share of revenue" icon={PieIcon} tone="violet">
                        <DonutChart slices={topByRevenue.slice(0, 6).map(p => ({ name: p.name, value: p.revenue }))} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={6}>
                    <ReportSection title="Most Ordered Items" subtitle="By units" icon={Trophy} tone="amber">
                        <RankBars items={topByQty.map(p => ({ label: p.name, value: p.qty }))} unit="integer" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={6}>
                    <ReportSection title="Top Items by Revenue" icon={DollarSign} tone="emerald">
                        <RankBars items={topByRevenue.map(p => ({ label: p.name, value: p.revenue, sub: `${formatNumber(p.qty)} units` }))} colorIndex={1} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Item Details" subtitle={`${processedItems.length} rows`} icon={Receipt} flush>
                <ReportTable columns={columns} rows={processedItems} rowKey={(i, idx) => idx} pageSize={25} empty="No items found" />
            </ReportSection>
        </ReportShell>
    );
}
