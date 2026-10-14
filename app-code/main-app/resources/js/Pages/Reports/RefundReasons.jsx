import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { RefreshCcw, FileText } from 'lucide-react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

function useIsDesktop() {
    const q = '(min-width: 768px)';
    const [on, setOn] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : true));
    useEffect(() => {
        const m = window.matchMedia(q);
        const h = () => setOn(m.matches);
        h();
        m.addEventListener('change', h);
        return () => m.removeEventListener('change', h);
    }, []);
    return on;
}

export default function RefundReasons({ reasons = [] }) {
    const { props } = usePage();
    const store = props.store || {};
    const isDesktop = useIsDesktop();

    if (isDesktop) {
        const money = (v) => formatCurrency(Number(v || 0), store);
        const totalCount = reasons.reduce((a, r) => a + Number(r.count || 0), 0);
        const totalAmt = reasons.reduce((a, r) => a + Number(r.total_amount || 0), 0);
        const label = (r) => r.refund_reason || 'Unspecified Reason';
        return (
            <ReportShell title="Refund Reasons" exportConfig={{ filename: 'refund-reasons', columns: [{ key: 'reason', label: 'Refund Reason' }, { key: 'count', label: 'Total Returns' }, { key: 'amount', label: 'Total Refunded' }], rows: reasons.map((r) => ({ reason: label(r), count: r.count, amount: r.total_amount })) }}>
                <ReportKpis items={[
                    { label: 'Reasons', value: reasons.length, icon: FileText, tone: 'brand' },
                    { label: 'Total returns', value: totalCount, icon: RefreshCcw, tone: 'amber' },
                    { label: 'Total refunded', value: money(totalAmt), icon: RefreshCcw, tone: 'rose', valueTone: 'rose' },
                ]} />
                <ReportGrid>
                    <ReportCol span={5}>
                        <ReportSection title="Refunded by reason" icon={RefreshCcw} tone="rose">
                            <DonutChart height={260} slices={reasons.map((r) => ({ name: label(r), value: Number(r.total_amount || 0) }))} />
                        </ReportSection>
                    </ReportCol>
                    <ReportCol span={7}>
                        <ReportSection title="Top reasons" subtitle="By amount refunded" icon={FileText} tone="amber">
                            <RankBars items={reasons.map((r) => ({ label: label(r), value: Number(r.total_amount || 0), sub: `${r.count} returns` }))} limit={6} />
                        </ReportSection>
                    </ReportCol>
                </ReportGrid>
                <ReportSection title="All reasons" flush>
                    <ReportTable rows={reasons} rowKey={(r, i) => i} empty="No refund records found"
                        columns={[
                            { key: 'refund_reason', label: 'Refund Reason', sortable: true, get: label, render: (r) => <span className="font-semibold text-ink">{label(r)}</span> },
                            { key: 'count', label: 'Total Returns', align: 'center', sortable: true },
                            { key: 'total_amount', label: 'Total Refunded', align: 'right', sortable: true, render: (r) => <span className="font-bold text-rose-600 dark:text-rose-400">{money(r.total_amount)}</span> },
                        ]}
                        totals={{ count: totalCount, total_amount: money(totalAmt) }} />
                </ReportSection>
            </ReportShell>
        );
    }

    return (
        <OneGlanceLayout title="Refund Reasons Report" activeMenu="Reports" noPadding>
            <Head title="Refund Reasons Report" />

            <div className="max-md:p-1.5 md:contents">
            <ListPageFrame className="max-md:block max-md:space-y-6 max-md:p-4">
                <ListToolbar title="Refund Reasons" />
                <ListStatCards cards={[
                    { label: 'Reasons', value: reasons.length, icon: FileText },
                    { label: 'Total returns', value: reasons.reduce((a, r) => a + Number(r.count || 0), 0), icon: RefreshCcw },
                    { label: 'Total refunded', value: formatCurrency(reasons.reduce((a, r) => a + Number(r.total_amount || 0), 0), store), icon: RefreshCcw, icon_tone: 'bg-rose-50 text-rose-600', value_tone: 'text-rose-600' },
                ]} />
                <MobileListHeader title="Refund Reasons" />
                <MobileStats bp="md" hero={2} items={[
                    { label: 'Reasons', value: reasons.length, tone: 'ink', icon: FileText },
                    { label: 'Returns', value: reasons.reduce((a, r) => a + Number(r.count || 0), 0), tone: 'amber', icon: RefreshCcw },
                    { label: 'Refunded', value: formatCurrency(reasons.reduce((a, r) => a + Number(r.total_amount || 0), 0), store), tone: 'rose', icon: RefreshCcw },
                ]} />

                <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden md:flex-1 md:min-h-0 md:overflow-auto md:rounded-[14px]">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-app border-b border-line text-xs text-ink-muted font-bold uppercase md:sticky md:top-0 md:z-10">
                                <th className="sticky top-0 z-10 bg-app p-4">Refund Reason</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-center">Total Returns</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-right">Total Refunded</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {reasons.length > 0 ? (
                                reasons.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
                                        <td className="p-4 font-semibold text-ink">
                                            {item.refund_reason || 'Unspecified Reason'}
                                        </td>
                                        <td className="p-4 text-center font-bold text-ink-secondary">
                                            {item.count}
                                        </td>
                                        <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(item.total_amount || 0, store)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-5 sm:p-12 text-center text-ink-muted">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 mb-2 text-neutral-300 dark:text-ink-secondary" />
                                            <p className="font-semibold">No refund records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
