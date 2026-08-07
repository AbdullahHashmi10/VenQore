import React, { useState } from 'react';
import { Scale, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function TrialBalance({
    accounts = [],
    totalDebits = 0,
    totalCredits = 0,
    isBalanced = true,
    asOf = '',
}) {
    const {
        store
    } = usePage().props;

    // Guard: Prevent rendering until store context is derived
    if (!store?.slug) return null;

    const [dateInput, setDateInput] = useState(asOf);

    // Apply date filter — re-fetches from the server
    const applyDate = () => {
        router.get(route("store.reports.trial-balance", {
            store_slug: store.slug
        }), { date: dateInput }, { preserveScroll: true });
    };

    // Stats row — uses pre-computed server values (not re-summed in JS, to avoid float drift)
    const difference = totalDebits - totalCredits;

    const reportStats = [
        {
            label: 'Total Debits',
            value: formatCurrency(totalDebits),
            icon: <ArrowDownLeft size={18} />,
            type: 'neutral',
        },
        {
            label: 'Total Credits',
            value: formatCurrency(totalCredits),
            icon: <ArrowUpRight size={18} />,
            type: 'neutral',
        },
        {
            label: 'Difference',
            value: formatCurrency(Math.abs(difference)),
            subValue: isBalanced ? 'BALANCED ✓' : 'UNBALANCED ✗',
            icon: <Scale size={18} />,
            type: isBalanced ? 'up' : 'down',
        },
    ];

    const columns = [
        {
            key: 'code',
            label: 'Code',
            sortable: true,
            render: (row) => (
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                    {row.code}
                </span>
            ),
        },
        {
            key: 'name',
            label: 'Account Name',
            sortable: true,
            render: (row) => (
                <span className="font-medium text-slate-900 dark:text-white">{row.name}</span>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (row) => (
                <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {row.type}
                </span>
            ),
        },
        {
            key: 'debit',
            label: 'Debit',
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                </span>
            ),
        },
        {
            key: 'credit',
            label: 'Credit',
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                </span>
            ),
        },
        {
            key: 'net',
            label: 'Net (Dr − Cr)',
            align: 'right',
            sortable: true,
            render: (row) => {
                const net = row.net ?? (row.debit - row.credit);
                const positive = net >= 0;
                return (
                    <span className={`font-semibold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {positive ? '' : '−'}{formatCurrency(Math.abs(net))}
                    </span>
                );
            },
        },
    ];

    // Date filter UI injected above the table via the `filters` prop of MasterReport
    const filters = [
        {
            key: 'date',
            label: 'As Of Date',
            type: 'custom',
            render: () => (
                <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-slate-400" />
                    <input
                        type="date"
                        value={dateInput}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDateInput(e.target.value)}
                        onBlur={applyDate}
                        onKeyDown={(e) => e.key === 'Enter' && applyDate()}
                        className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm
                                   bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                                   focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                </div>
            ),
        },
    ];

    return (
        <ReportsLayout title="Trial Balance">
            <Head title="Trial Balance" />

            {/* Balance Status Banner */}
            <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border
                ${isBalanced
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
            >
                {isBalanced
                    ? <CheckCircle2 size={20} className="shrink-0" />
                    : <AlertTriangle size={20} className="shrink-0" />
                }
                <div>
                    <span className="font-bold">
                        {isBalanced ? 'Ledger is Balanced' : 'LEDGER IS UNBALANCED'}
                    </span>
                    <span className="ml-2 font-normal text-sm opacity-80">
                        {isBalanced
                            ? `Total Debits = Total Credits = ${formatCurrency(totalDebits)} — as of ${asOf}`
                            : `Difference of ${formatCurrency(Math.abs(difference))} between Debits and Credits — as of ${asOf}. Investigate immediately.`
                        }
                    </span>
                </div>
            </div>

            <MasterReport
                title="Trial Balance"
                stats={reportStats}
                columns={columns}
                data={accounts}
                filters={filters}
                onExport={() => alert('Export feature coming soon')}
            />
        </ReportsLayout>
    );
}
