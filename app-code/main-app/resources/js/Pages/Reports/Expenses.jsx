import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, DollarSign, Tag, PieChart as PieIcon, Sparkles, BrainCircuit, Receipt, TrendingUp, Layers } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, FilterSelect, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const formatDate = (dateString, options = {}) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleDateString('en-GB', options); } catch (e) { return dateString; }
};
const catName = (e) => (typeof e.category === 'string' ? e.category : e.category?.name) || 'Uncategorized';

export default function ExpenseReport({ expenses = [], stats = {}, filters = {}, categories = [] }) {
    const { store } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [customStart, setCustomStart] = useState(filters.start_date || '');
    const [customEnd, setCustomEnd] = useState(filters.end_date || '');

    const processedExpenses = useMemo(() => {
        let data = [...expenses];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter((item) =>
                (item.description || '').toLowerCase().includes(q) ||
                (item.reference || '').toLowerCase().includes(q) ||
                catName(item).toLowerCase().includes(q));
        }
        if (selectedCategory) {
            data = data.filter((item) =>
                (item.category_id && String(item.category_id) === String(selectedCategory)) ||
                (item.category?.id && String(item.category.id) === String(selectedCategory)));
        }
        return data;
    }, [expenses, searchQuery, selectedCategory]);

    const aiInsights = useMemo(() => {
        if (expenses.length === 0) return [{ type: 'neutral', title: 'Data Required', message: 'Add expenses to unlock cost analysis.' }];
        const out = [];
        const totalExp = stats.total_expenses || 0;
        if (stats.top_category && totalExp > 0) {
            const share = (stats.top_category.total / totalExp) * 100;
            if (share > 40) out.push({ type: 'warning', title: 'Concentrated Spending', message: `${stats.top_category.name} consumes ${share.toFixed(1)}% of your budget. Inspect this category for savings.` });
            else out.push({ type: 'success', title: 'Balanced Budget', message: `Expense categories are well distributed. Top category is only ${share.toFixed(1)}%.` });
        }
        if (stats.avg_daily > 10000) out.push({ type: 'neutral', title: 'High Burn Rate', message: `Average daily expense is ${formatCurrency(stats.avg_daily)}. Ensure high revenue days match this outflow.` });
        return out;
    }, [expenses, stats]);

    const charts = useMemo(() => {
        const cats = {}; const daily = {};
        processedExpenses.forEach((e) => {
            const amt = parseFloat(e.amount || 0);
            cats[catName(e)] = (cats[catName(e)] || 0) + amt;
            const d = e.date ? String(e.date).split('T')[0].split(' ')[0] : '';
            if (d) daily[d] = (daily[d] || 0) + amt;
        });
        return {
            categories: Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            trend: Object.keys(daily).sort().map((x) => ({ x, y: daily[x] })),
        };
    }, [processedExpenses]);

    const applyFilters = (range, cat, from, to) => {
        const params = { range };
        if (cat) params.category_id = cat;
        if (range === 'custom') {
            if (from) params.start_date = from;
            if (to) params.end_date = to;
        }
        router.get(route('store.reports.expenses', { store_slug: store.slug }), params, { preserveState: true, preserveScroll: true });
    };

    const onDates = ({ from, to }) => {
        setCustomStart(from || '');
        setCustomEnd(to || '');
        if (from && to) applyFilters('custom', selectedCategory, from, to);
    };
    const onCategory = (cat) => {
        setSelectedCategory(cat);
        const custom = customStart && customEnd;
        applyFilters(custom ? 'custom' : (filters.range || 'this_month'), cat, customStart, customEnd);
    };

    const columns = [
        { key: 'date', label: 'Date', sortable: true, get: (r) => r.date || '', render: (r) => <span className="font-mono text-ink-muted">{formatDate(r.date)}</span> },
        { key: 'reference', label: 'Reference', sortable: true, get: (r) => r.reference || '', render: (r) => <span className="font-mono font-bold text-ink-secondary">{r.reference}</span> },
        { key: 'category', label: 'Category', sortable: true, get: catName, render: (r) => <span className="rounded-[12px] bg-sunken px-2 py-1 text-2xs font-bold uppercase text-ink-secondary">{catName(r)}</span> },
        { key: 'description', label: 'Description', get: (r) => r.description || '' },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, get: (r) => parseFloat(r.amount || 0), render: (r) => <span className="font-bold text-rose-600">{formatCurrency(r.amount)}</span> },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${filterInputCls} w-56 pl-9`} />
            </div>
            {categories.length > 0 && (
                <FilterSelect value={selectedCategory} onChange={onCategory}
                    options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
            )}
            <DateRangeFilter from={customStart} to={customEnd} onChange={onDates} />
        </>
    );

    return (
        <ReportShell
            title="Expense Report"
            subtitle="Track company spending and overheads"
            filters={filterNode}
            exportConfig={{
                filename: 'expense-report',
                columns: [
                    { label: 'Date', get: (r) => r.date },
                    { label: 'Reference', get: (r) => r.reference },
                    { label: 'Category', get: catName },
                    { label: 'Description', get: (r) => r.description },
                    { label: 'Amount', get: (r) => r.amount },
                ],
                rows: processedExpenses,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Expenses', value: formatCurrency(stats.total_expenses || 0), icon: DollarSign, tone: 'rose', valueTone: 'rose' },
                { label: 'Avg Daily Spend', value: formatCurrency(stats.avg_daily || 0), icon: PieIcon, tone: 'brand' },
                { label: 'Top Category', value: stats.top_category?.name || 'N/A', sub: stats.top_category ? formatCurrency(stats.top_category.total) : undefined, icon: Tag, tone: 'violet' },
                { label: 'Total Records', value: stats.count || 0, icon: Receipt, tone: 'slate' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Spend trend" subtitle="Expenses per day" icon={TrendingUp} tone="rose">
                        <TrendChart series={[{ name: 'Expenses', points: charts.trend }]} type="area" unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Category breakdown" subtitle="Share of spend" icon={PieIcon} tone="amber">
                        <DonutChart slices={charts.categories} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Top categories" icon={Layers} tone="violet">
                        <RankBars items={charts.categories.map((c) => ({ label: c.name, value: c.value }))} unit="currency" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Insights" icon={BrainCircuit} tone="sky">
                        <div className="flex flex-col gap-2">
                            {aiInsights.map((insight, idx) => (
                                <div key={idx} className="rounded-[12px] border border-line bg-app p-3 text-xs">
                                    <div className="mb-1 flex items-center gap-2">
                                        <Sparkles size={12} className={insight.type === 'warning' || insight.type === 'critical' ? 'text-rose-500' : 'text-emerald-500'} />
                                        <span className="font-bold text-ink">{insight.title}</span>
                                    </div>
                                    <p className="leading-relaxed text-ink-secondary">{insight.message}</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Expense history" subtitle={`${processedExpenses.length} records`} flush>
                <ReportTable columns={columns} rows={processedExpenses} rowKey={(r, i) => r.id ?? i} empty="No expenses found" />
            </ReportSection>
        </ReportShell>
    );
}
