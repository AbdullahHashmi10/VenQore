import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { usePage } from '@inertiajs/react';
import { ReportShell, ReportKpis, ReportSection, ReportTable, filterInputCls } from '@/Components/Reports/ReportKit';
import { DonutChart } from '@/Components/Reports/ReportCharts';
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    FileText,
    LayoutDashboard,
    PieChart,
    BarChart3,
    ArrowUpCircle,
    ArrowDownCircle,
    Copy,
    Trash2,
    Eye,
    ChevronUp,
    ChevronDown,
    Printer,
    Download,
    TrendingUp,
    Briefcase
} from 'lucide-react';

export default function ChartOfAccounts({ accounts = [] }) {
    const { store } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });

    // Calculate Stats
    const stats = useMemo(() => {
        return {
            assets: accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
            liabilities: accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
            income: accounts.filter(a => a.type === 'income').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
            expenses: accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0),
        };
    }, [accounts]);

    // Process Data
    const processedAccounts = useMemo(() => {
        let result = accounts.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (typeFilter === 'all' || item.type === typeFilter)
        );

        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'balance') {
                valA = parseFloat(a.balance || 0);
                valB = parseFloat(b.balance || 0);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [accounts, searchTerm, typeFilter, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getTypeConfig = (type) => {
        const configs = {
            asset: { label: 'Asset', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: Briefcase },
            liability: { label: 'Liability', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: ArrowDownCircle },
            equity: { label: 'Equity', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', icon: PieChart },
            income: { label: 'Income', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            expense: { label: 'Expense', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle }
        };
        return configs[type] || { label: type, color: 'bg-neutral-100 text-ink-secondary', icon: BookOpen };
    };



    const columns = [
        { key: 'code', label: 'Code', sortable: true, render: (a) => <span className="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs font-bold text-ink-muted">{a.code}</span> },
        { key: 'name', label: 'Account Name', sortable: true, render: (a) => <span className="font-bold text-ink-secondary">{a.name}</span> },
        { key: 'type', label: 'Type', render: (a) => {
            const c = getTypeConfig(a.type); const Icon = c.icon;
            return <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-2xs font-bold uppercase ${c.color}`}><Icon size={10} />{c.label}</span>;
        } },
        { key: 'balance', label: 'Balance', align: 'right', sortable: true, get: (a) => parseFloat(a.balance) || 0, render: (a) => <span className="font-mono text-sm font-bold text-ink">{formatCurrency(a.balance)}</span> },
    ];

    const filterNode = (
        <>
            <div className="flex flex-wrap items-center gap-1">
                {['all', 'asset', 'liability', 'equity', 'income', 'expense'].map((type) => (
                    <button key={type} type="button" onClick={() => setTypeFilter(type)}
                        className={`h-10 rounded-[12px] px-3 text-sm font-semibold capitalize transition-colors ${typeFilter === type ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>
                        {type}
                    </button>
                ))}
            </div>
            <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search accounts..." className={`${filterInputCls} w-56 pl-9`} />
            </div>
        </>
    );

    return (
        <ReportShell
            title="Chart of Accounts"
            activeKey="chart-of-accounts"
            filters={filterNode}
            actions={(
                <button type="button" className="flex h-10 items-center gap-2 rounded-[12px] bg-brand-600 px-3 text-sm font-bold text-white transition-colors hover:bg-brand-700">
                    <Plus size={16} /><span className="hidden sm:inline">New Account</span>
                </button>
            )}
            exportConfig={{
                filename: 'chart-of-accounts',
                columns: [
                    { label: 'Code', get: (r) => r.code },
                    { label: 'Account', get: (r) => r.name },
                    { label: 'Type', get: (r) => r.type },
                    { label: 'Balance', get: (r) => r.balance },
                ],
                rows: processedAccounts,
            }}
        >
            <ReportKpis items={[
                { label: 'Assets', value: formatCurrency(stats.assets), icon: Briefcase, tone: 'brand' },
                { label: 'Liabilities', value: formatCurrency(stats.liabilities), icon: ArrowDownCircle, tone: 'rose' },
                { label: 'Income (YTD)', value: formatCurrency(stats.income), icon: TrendingUp, tone: 'emerald' },
                { label: 'Expense (YTD)', value: formatCurrency(stats.expenses), icon: ArrowUpCircle, tone: 'amber' },
            ]} />

            <ReportSection title="Balance by type">
                <DonutChart slices={[
                    { name: 'Assets', value: Math.abs(stats.assets) },
                    { name: 'Liabilities', value: Math.abs(stats.liabilities) },
                    { name: 'Income', value: Math.abs(stats.income) },
                    { name: 'Expenses', value: Math.abs(stats.expenses) },
                ].filter((s) => s.value > 0)} height={240} />
            </ReportSection>

            <ReportSection title="Accounts" subtitle={`${processedAccounts.length} accounts`} flush>
                <ReportTable columns={columns} rows={processedAccounts} rowKey={(a) => a.id} pageSize={100} empty="No accounts found" emptyIcon={BookOpen} />
            </ReportSection>
        </ReportShell>
    );
}
