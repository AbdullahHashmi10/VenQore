import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Calendar, AlertTriangle, Package, CheckCircle, BarChart3, Table2, Trophy } from 'lucide-react';
import { formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, FilterSelect } from '@/Components/Reports/ReportKit';
import { TrendChart, RankBars } from '@/Components/Reports/ReportCharts';

const daysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

export default function ExpiryReport({ batches = [], stats = {}, filters = {} }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const apply = (key, value) => {
        const next = { ...filters, [key]: value };
        Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
        router.get(route('store.reports.expiry', { store_slug: store.slug }), next, { preserveState: true, replace: true });
    };

    const buckets = useMemo(() => {
        const defs = [['Expired', (d) => d < 0], ['0-30 days', (d) => d >= 0 && d <= 30], ['31-60 days', (d) => d > 30 && d <= 60], ['61-90 days', (d) => d > 60 && d <= 90], ['90+ days', (d) => d > 90]];
        return defs.map(([name, test]) => ({ x: name, y: batches.filter((b) => test(daysLeft(b.expiry_date))).reduce((s, b) => s + (Number(b.quantity) || 0), 0) }));
    }, [batches]);

    const soonest = useMemo(() => [...batches]
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)).slice(0, 8)
        .map((b) => ({ label: `${b.product?.name || 'Item'} (${b.batch_number})`, value: Number(b.quantity) || 0, sub: `${daysLeft(b.expiry_date)} days` })), [batches]);

    const columns = [
        { key: 'product_name', label: tt('Product'), sortable: true, get: (r) => r.product?.name || '',
          render: (r) => (<div className="min-w-0"><div className="truncate text-sm font-semibold text-ink">{r.product?.name}</div><div className="truncate text-xs text-ink-muted">Batch: {r.batch_number}</div></div>) },
        { key: 'expiry_date', label: 'Expiry Date', sortable: true, get: (r) => new Date(r.expiry_date).getTime(),
          render: (r) => {
              const d = daysLeft(r.expiry_date);
              const c = d < 0 ? 'text-rose-600 font-bold' : d <= 30 ? 'text-amber-600 font-bold' : d <= 90 ? 'text-blue-600' : 'text-ink-secondary';
              return <span className={c}>{new Date(r.expiry_date).toLocaleDateString('en-PK')} ({d} days)</span>;
          } },
        { key: 'quantity', label: 'Quantity', align: 'right', sortable: true, get: (r) => Number(r.quantity) || 0, render: (r) => <span className="font-medium">{formatNumber(r.quantity)}</span> },
        { key: 'warehouse', label: 'Warehouse', get: (r) => r.warehouse?.name || '', render: (r) => r.warehouse?.name || '-' },
    ];

    return (
        <ReportShell
            title="Expiry Report"
            subtitle="Batches that are expired or about to expire"
            activeKey="expiry"
            exportConfig={{ filename: 'expiry_report', rows: batches, columns: [
                { label: 'Product', get: (r) => r.product?.name || '' }, { label: 'Batch', get: (r) => r.batch_number },
                { label: 'Expiry Date', get: (r) => r.expiry_date }, { label: 'Days Left', get: (r) => daysLeft(r.expiry_date) },
                { label: 'Quantity', get: (r) => r.quantity }, { label: 'Warehouse', get: (r) => r.warehouse?.name || '' },
            ] }}
            filters={(
                <FilterSelect label="Expires within" value={filters.days_threshold} onChange={(v) => apply('days_threshold', v)}
                    options={[{ value: '', label: 'Default' }, { value: '30', label: '30 Days' }, { value: '60', label: '60 Days' }, { value: '90', label: '90 Days' }, { value: '180', label: '6 Months' }, { value: '365', label: '1 Year' }]} />
            )}
        >
            <ReportKpis items={[
                { label: 'Expired Items', value: stats.expired_count ?? 0, icon: AlertTriangle, tone: 'rose', valueTone: 'rose' },
                { label: 'Expiring Soon (30 Days)', value: stats.expiring_soon_count ?? 0, icon: Calendar, tone: 'amber', valueTone: 'amber' },
                { label: 'Total Batches', value: stats.total_batches ?? 0, icon: Package, tone: 'brand' },
                { label: 'Total Quantity', value: formatNumber(stats.total_quantity), icon: CheckCircle, tone: 'emerald' },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Expiry timeline" subtitle="Units by time left" icon={BarChart3}>
                        <TrendChart type="bar" unit="integer" label="Units" points={buckets} height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Expiring first" subtitle="Soonest batches, by quantity" icon={Trophy} tone="amber">
                        <RankBars items={soonest} unit="integer" colorIndex={3} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Batches" subtitle={`${batches.length} batches`} icon={Table2} flush>
                <ReportTable columns={columns} rows={batches} rowKey={(r) => r.id ?? `${r.batch_number}-${r.product?.id}`} />
            </ReportSection>
        </ReportShell>
    );
}
