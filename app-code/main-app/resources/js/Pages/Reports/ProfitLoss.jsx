import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    TrendingUp, TrendingDown, DollarSign, Activity, Percent, Zap, Loader2, X, ShieldCheck, AlertCircle, PieChart as PieIcon, BarChart3, FileText,
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    RangePicker, ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

const RANGES = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
];

export default function ProfitLoss({ stats = {}, filters = {} }) {
    const { store } = usePage().props;
    const pageProps = usePage().props;
    const tt = useTermText();

    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const revenue = parseFloat(stats.revenue || 0);
    const cogs = parseFloat(stats.cogs || 0);
    const expenses = parseFloat(stats.expenses || 0);
    const grossProfit = parseFloat(stats.gross_profit || 0);
    const netProfit = parseFloat(stats.net_profit || 0);

    const grossMargin = revenue ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
    const netMargin = revenue ? ((netProfit / revenue) * 100).toFixed(1) : 0;
    const cogsRatio = revenue ? ((cogs / revenue) * 100).toFixed(1) : 0;
    const expenseRatio = revenue ? ((expenses / revenue) * 100).toFixed(1) : 0;

    const slices = [
        { name: 'COGS', value: cogs },
        { name: 'Expenses', value: expenses },
        { name: 'Net Profit', value: Math.max(0, netProfit) },
    ].filter((d) => d.value > 0);

    const compare = [
        { x: 'Revenue', y: revenue },
        { x: 'COGS', y: cogs },
        { x: 'Gross Profit', y: grossProfit },
        { x: 'Expenses', y: expenses },
        { x: 'Net Profit', y: netProfit },
    ];

    const go = (params) => router.get(route('store.reports.profit-loss', { store_slug: store.slug }), params, { preserveState: true, preserveScroll: true });
    const handleRangeChange = (r) => { setRange(r); if (r !== 'custom') go({ range: r }); };
    const applyCustomRange = () => go({ range: 'custom', start_date: startDate, end_date: endDate });

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const insights = [];
            if (grossMargin < 20) insights.push({ type: 'danger', title: 'Low Gross Margin', text: tt('Your production costs (COGS) are eating most of your revenue. Negotiate better rates with suppliers.') });
            else insights.push({ type: 'success', title: 'Healthy Gross Margin', text: 'Your core product pricing is solid. You have good room for overheads.' });
            if (expenseRatio > 40) insights.push({ type: 'warning', title: 'High Overheads', text: `Your operating expenses are ${expenseRatio}% of revenue. This is higher than the recommended 30% benchmark.` });
            if (revenue === 0) insights.push({ type: 'neutral', title: 'No Data', text: 'Start making sales to unlock deeper insights.' });
            else if (netProfit > 0) insights.push({ type: 'opportunity', title: 'Growth Opportunity', text: 'You are profitable! Consider reinvesting 20% of net profit into marketing to accelerate growth.' });
            setAnalysisResult({ score: Math.max(0, Math.min(100, parseFloat(netMargin) + 50)), insights });
            setIsAnalyzing(false);
        }, 2000);
    };

    const cogsLedger = () => pageProps.meta?.cogs_account_id && router.visit(route('store.reports.account-ledger', {
        store_slug: store.slug, account_id: pageProps.meta.cogs_account_id, start_date: filters.start_date, end_date: filters.end_date,
    }));

    const rows = [
        { id: 'rev', label: 'Sales Revenue', amount: revenue, percent: 100, info: 'Total income from goods sold before any deductions.', kind: 'head' },
        { id: 'cogs', label: 'Cost of Goods Sold (COGS)', amount: -cogs, percent: cogsRatio, info: 'Direct costs attributable to the production of the goods sold (e.g., material cost).', kind: 'neg', action: !!pageProps.meta?.cogs_account_id },
        { id: 'gp', label: 'Gross Profit', amount: grossProfit, percent: grossMargin, info: 'Revenue minus COGS. Indicates how efficiently you produce goods.', kind: 'sub' },
        { id: 'opex', label: 'Operating Expenses', amount: -expenses, percent: expenseRatio, info: 'Expenses incurred in normal business operations (Rent, Utilities, Salaries).', kind: 'neg' },
        { id: 'net', label: 'Net Profit / (Loss)', amount: netProfit, percent: netMargin, info: "The 'Bottom Line'. Total earnings after subtracting all expenses and costs.", kind: 'total' },
    ];

    const columns = [
        {
            key: 'label', label: 'Description',
            render: (r) => (
                <span title={r.info} className={`${r.kind === 'sub' || r.kind === 'total' ? 'font-bold uppercase tracking-wider text-ink' : r.kind === 'head' ? 'font-bold text-ink' : ''}`}>
                    {r.label}{r.action ? <span className="ml-2 text-xs font-bold text-brand-500">View Ledger &rarr;</span> : null}
                </span>
            ),
        },
        {
            key: 'amount', label: 'Amount', align: 'right',
            render: (r) => (
                <span className={`font-bold ${r.kind === 'neg' ? 'text-rose-500' : r.kind === 'sub' || r.kind === 'total' ? (r.amount < 0 ? 'text-rose-600' : 'text-emerald-600') : 'text-ink'}`}>
                    {formatCurrency(r.amount, store)}
                </span>
            ),
        },
        { key: 'percent', label: '% Sales', align: 'right', render: (r) => `${r.percent}%` },
    ];

    const filters_ = (
        <>
            <RangePicker value={range} onChange={handleRangeChange} options={RANGES} />
            {range === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangeFilter presets={false} from={startDate} to={endDate} onChange={({ from, to }) => { setStartDate(from); setEndDate(to); }} />
                    <button type="button" onClick={applyCustomRange} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700">Apply</button>
                </div>
            )}
        </>
    );

    return (
        <ReportShell
            title="Profit & Loss" subtitle="Financial performance for the selected period" activeKey="profit-loss"
            filters={filters_}
            actions={(
                <button type="button" onClick={runAnalysis} disabled={isAnalyzing}
                    className="flex h-10 items-center gap-2 rounded-[12px] bg-emerald-600 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-50">
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    <span className="hidden sm:inline">{isAnalyzing ? 'Scanning...' : 'Run Analysis'}</span>
                </button>
            )}
            exportConfig={{
                filename: 'profit-loss',
                columns: [{ label: 'Description', get: (r) => r.label }, { label: 'Amount', get: (r) => r.amount }, { label: '% Sales', get: (r) => r.percent }],
                rows,
            }}
        >
            <ReportKpis items={[
                { label: 'Revenue', value: formatCurrency(revenue, store), icon: DollarSign, tone: 'blue' },
                { label: 'Net Profit', value: formatCurrency(netProfit, store), sub: `${netMargin}% of revenue`, icon: DollarSign, tone: netProfit >= 0 ? 'emerald' : 'rose', valueTone: netProfit >= 0 ? 'emerald' : 'rose' },
                { label: 'Gross Profit', value: formatCurrency(grossProfit, store), sub: `${grossMargin}% margin`, icon: TrendingUp, tone: 'blue' },
                { label: 'Total Expenses', value: formatCurrency(expenses, store), sub: `${expenseRatio}% of revenue`, icon: TrendingDown, tone: 'rose' },
                { label: 'COGS', value: formatCurrency(cogs, store), sub: `${cogsRatio}% of revenue`, icon: Percent, tone: 'amber' },
                { label: 'Revenue Efficiency', value: `${(100 - expenseRatio - cogsRatio).toFixed(1)}%`, sub: 'Retained from sales', icon: Activity, tone: 'brand' },
            ]} />

            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Income vs costs" subtitle="Revenue, costs and profit for the period" icon={BarChart3}>
                        <TrendChart type="bar" label="Amount" points={compare} height={260} legend={false} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Revenue distribution" subtitle={`Net margin ${netMargin}%`} icon={PieIcon} tone="amber"
                        right={netProfit >= 0 && netMargin > 20 ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><ShieldCheck size={14} />Excellent</span> : netMargin > 5 ? <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"><Activity size={14} />Stable</span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><AlertCircle size={14} />Needs attention</span>}>
                        <DonutChart slices={slices} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Income statement" subtitle="Click COGS to open its ledger" icon={FileText} tone="violet" flush>
                <ReportTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={0}
                    onRowClick={(r) => { if (r.id === 'cogs') cogsLedger(); }} />
            </ReportSection>

            {analysisResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl">
                        <div className="relative bg-brand-600 p-6 text-white">
                            <div className="mb-2 flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/20"><Activity size={22} /></div>
                                <button type="button" onClick={() => setAnalysisResult(null)} className="text-white/70 transition-colors hover:text-white"><X size={20} /></button>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Analysis Report</h2>
                            <p className="text-sm font-medium text-brand-200">Business Health Score: <span className="font-bold text-white">{analysisResult.score.toFixed(0)}/100</span></p>
                        </div>
                        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-4">
                            {analysisResult.insights.map((insight, idx) => (
                                <div key={idx} className={`rounded-[12px] border-l-4 p-4 ${insight.type === 'danger' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : insight.type === 'warning' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : insight.type === 'success' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-brand-500 bg-sunken'}`}>
                                    <h4 className={`mb-1 text-sm font-bold ${insight.type === 'danger' ? 'text-rose-700 dark:text-rose-400' : insight.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : insight.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink'}`}>{insight.title}</h4>
                                    <p className="text-xs leading-relaxed text-ink-secondary">{insight.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end border-t border-line bg-app p-4">
                            <button type="button" onClick={() => setAnalysisResult(null)} className="h-10 rounded-[12px] bg-neutral-800 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-700">Dismiss Report</button>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    );
}
