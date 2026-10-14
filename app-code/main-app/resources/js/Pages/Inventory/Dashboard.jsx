import React, { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTermText } from '@/lib/terms';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useStockNavGroups } from '@/Components/StockModuleTabs';
import StockModuleTabs from '@/Components/StockModuleTabs';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import {
    Package, AlertTriangle, DollarSign, Warehouse, PackageX, Layers, TrendingUp, ArrowRight, PieChart as PieIcon, Table2, Zap,
} from 'lucide-react';

export default function InventoryDashboard({ stats = {}, topMoving = [], expiringBatches = [], valueByCategory = [], recentReceipts = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const stockNavGroups = useStockNavGroups();
    const slug = store?.slug;
    const r = (name, extra = {}) => route(name, { store_slug: slug, ...extra });

    const movers = useMemo(() => topMoving.map((i) => ({ label: i.name, value: Number(i.total_sold) || 0, sub: 'units sold' })), [topMoving]);
    const categorySlices = useMemo(() => valueByCategory.filter((c) => c.value > 0), [valueByCategory]);

    const receiptCols = [
        { key: 'product_name', label: tt('Product Name'), sortable: true, render: (x) => <span className="font-semibold text-ink">{x.product_name}</span> },
        { key: 'initial_qty', label: 'Received', align: 'right', sortable: true, get: (x) => Number(x.initial_qty) || 0, render: (x) => formatNumber(Number(x.initial_qty) || 0) },
        { key: 'remaining_qty', label: 'Remaining', align: 'right', sortable: true, get: (x) => Number(x.remaining_qty) || 0, render: (x) => formatNumber(Number(x.remaining_qty) || 0) },
        { key: 'unit_cost', label: 'Unit cost', align: 'right', get: (x) => Number(x.unit_cost) || 0, render: (x) => formatCurrency(Number(x.unit_cost) || 0, store) },
        { key: 'created_at', label: 'Received on', align: 'right', get: (x) => x.created_at, render: (x) => (x.created_at ? new Date(x.created_at).toLocaleDateString() : '') },
    ];
    const expiryCols = [
        { key: 'product_name', label: tt('Product Name'), render: (x) => <span className="font-semibold text-ink">{x.product_name}</span> },
        { key: 'batch_number', label: 'Batch', get: (x) => x.batch_number || 'N/A' },
        { key: 'remaining_qty', label: 'Remaining', align: 'right', render: (x) => `${formatNumber(Number(x.remaining_qty) || 0)} units` },
        { key: 'expiry_date', label: 'Expires', align: 'right', render: (x) => <span className="font-bold text-rose-600">{x.expiry_date}</span> },
    ];

    const links = [
        { label: tt('View All Products'), href: r('store.inventory.index') },
        { label: 'Stock Operations', href: r('store.stock-operations') },
        { label: tt('Create Purchase Order'), href: r('store.purchase-orders.create') },
        { label: 'View Reports', href: r('store.reports.index') },
    ];

    return (
        <ReportShell title="Inventory Dashboard" activeKey="overview" activeMenu="Stock" navGroups={stockNavGroups} showHub={false}>
            <div className="shrink-0 md:hidden"><StockModuleTabs activeTab="overview" /></div>

            <ReportKpis items={[
                { label: tt('Total Products'), value: formatNumber(stats.total_products || 0), icon: Package, tone: 'brand' },
                { label: 'Inventory Value', value: formatCurrency(stats.inventory_value || 0, store), icon: DollarSign, tone: 'emerald' },
                { label: 'Low Stock Items', value: formatNumber(stats.low_stock_count || 0), sub: stats.low_stock_count > 0 ? 'Action needed' : 'Healthy', icon: AlertTriangle, tone: 'amber', valueTone: stats.low_stock_count > 0 ? 'amber' : undefined },
                { label: 'Out of Stock', value: formatNumber(stats.out_of_stock_count || 0), icon: PackageX, tone: 'rose', valueTone: stats.out_of_stock_count > 0 ? 'rose' : undefined },
                { label: 'Categories', value: formatNumber(stats.total_categories || 0), icon: Layers, tone: 'violet' },
                { label: 'Warehouses', value: formatNumber(stats.total_warehouses || 0), icon: Warehouse, tone: 'sky' },
            ]} />

            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Stock value by category" subtitle="Where your inventory money sits" icon={PieIcon} tone="emerald">
                        <DonutChart slices={categorySlices} height={280} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Top moving items" subtitle="Most units sold" icon={TrendingUp} tone="brand"
                        right={<Link href={r('store.reports.index')} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">View reports</Link>}>
                        <RankBars items={movers} unit="integer" empty="No sales data available yet." />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Recent stock received" subtitle="Latest batches in" icon={Table2} flush>
                        <ReportTable columns={receiptCols} rows={recentReceipts} rowKey={(x) => x.id} pageSize={10} empty="No stock received yet" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Quick actions" icon={Zap} tone="violet">
                        <div className="flex flex-col gap-2">
                            {links.map((l) => (
                                <Link key={l.label} href={l.href} className="flex h-10 items-center justify-between rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
                                    <span>{l.label}</span><ArrowRight size={16} />
                                </Link>
                            ))}
                        </div>
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            {expiringBatches.length > 0 && (
                <ReportSection title="Batch expiry alerts" subtitle="Expiring in the next 30 days" icon={AlertTriangle} tone="rose" flush>
                    <ReportTable columns={expiryCols} rows={expiringBatches} rowKey={(x) => x.id} pageSize={10} />
                </ReportSection>
            )}
        </ReportShell>
    );
}
