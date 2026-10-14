import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowUpRight, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportTable, DateRangeFilter } from '@/Components/Reports/ReportKit';
import { RankBars } from '@/Components/Reports/ReportCharts';

export default function ItemReportByParty({ data = [], stats = [], filters = {} }) {
    const tt = useTermText();
    const { store } = usePage().props;

    const columns = [
        { key: 'party_name', label: tt('Customer'), sortable: true },
        { key: 'product_name', label: tt('Product'), sortable: true },
        { key: 'quantity', label: 'Qty', align: 'center', sortable: true },
        { key: 'total', label: 'Net Revenue', align: 'right', sortable: true, render: (row) => <span className="font-bold text-ink">{formatCurrency(row.total)}</span> },
    ];

    const handleFilterChange = (newValues) => {
        router.get(route('store.reports.item-report-by-party', { store_slug: store.slug }), newValues, { preserveState: true, replace: true });
    };

    const kpis = (stats || []).map((s) => ({
        label: s.label,
        value: s.value,
        sub: s.subValue,
        icon: React.isValidElement(s.icon) ? (p) => React.cloneElement(s.icon, { size: p.size }) : ArrowUpRight,
        tone: s.type === 'up' ? 'emerald' : s.type === 'down' ? 'amber' : 'brand',
        trend: s.type === 'up' || s.type === 'down' ? s.type : undefined,
    }));

    const ranked = useMemo(() => {
        const m = {};
        data.forEach((r) => {
            const k = r.party_name || 'Unknown';
            m[k] = m[k] || { label: k, value: 0, qty: 0 };
            m[k].value += Number(r.total) || 0;
            m[k].qty += Number(r.quantity) || 0;
        });
        return Object.values(m).sort((a, b) => b.value - a.value).map((x) => ({ label: x.label, value: x.value, sub: `${x.qty} units` }));
    }, [data]);

    return (
        <ReportShell title={tt('Item Report by Customer')} subtitle={tt('Net revenue per product, grouped by customer — FIFO reconciled')} activeKey="item-report-by-party"
            filters={<DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => handleFilterChange({ ...filters, start_date: from, end_date: to })} />}
            exportConfig={{ filename: 'item-report-by-party', columns: columns.map((c) => ({ label: c.label, get: (r) => r[c.key] })), rows: data }}>
            <ReportKpis items={kpis} />
            <ReportSection title="Net revenue by customer" subtitle="Top 8 by net revenue" icon={BarChart3}>
                <RankBars items={ranked} />
            </ReportSection>
            <ReportSection title="Details" subtitle={`${data.length} ${data.length === 1 ? 'record' : 'records'}`} flush>
                <ReportTable columns={columns} rows={data} rowKey={(r, i) => r.id ?? i} pageSize={100} empty="No results found matching your criteria"
                    totals={{ quantity: data.reduce((a, r) => a + (Number(r.quantity) || 0), 0), total: formatCurrency(data.reduce((a, r) => a + (Number(r.total) || 0), 0)) }} />
            </ReportSection>
        </ReportShell>
    );
}
