import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function BankStatement({ transactions = [], stats = {}, filters = {}, bank_accounts = [] }) {
    const {
        store
    } = usePage().props;

    // Map Stats
    const reportStats = [
        {
            label: 'Opening Balance',
            value: formatCurrency(stats.opening_balance, store),
            icon: <Wallet size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Deposits',
            value: formatCurrency(stats.total_deposits, store),
            icon: <ArrowDownLeft size={18} />,
            type: 'up'
        },
        {
            label: 'Total Withdrawals',
            value: formatCurrency(stats.total_withdrawals, store),
            icon: <ArrowUpRight size={18} />,
            type: 'down'
        },
        {
            label: 'Closing Balance',
            value: formatCurrency(stats.closing_balance, store),
            icon: <Landmark size={18} />,
            type: 'neutral'
        }
    ];

    // Map Columns
    const columns = [
        {
            key: 'date',
            label: 'Date',
            type: 'date',
            sortable: true
        },
        {
            key: 'reference',
            label: 'Reference',
            render: (row) => <span className="font-mono text-xs text-slate-500">{row.reference}</span>
        },
        {
            key: 'description',
            label: 'Description'
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'credit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                    {row.type === 'credit' ? 'Deposit' : 'Withdrawal'}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className={`font-bold ${row.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(row.amount, store)}
                </span>
            )
        },
        {
            key: 'balance',
            label: 'Balance',
            align: 'right',
            render: (row) => <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(row.balance, store)}</span>
        }
    ];

    // Filter Defs
    const filterDefs = [
        {
            key: 'bank_account_id',
            type: 'select',
            label: 'Bank Account',
            options: bank_accounts.map(b => ({ value: b.id, label: `${b.bank_name} - ${b.account_number}` }))
        },
        {
            key: 'start_date',
            type: 'date',
            label: 'Start Date'
        },
        {
            key: 'end_date',
            type: 'date',
            label: 'End Date'
        }
    ];

    const handleFilterChange = (newValues) => {
        router.get(route("store.reports.bank-statement", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Bank Statement">
            <Head title="Bank Statement" />

            <MasterReport
                title="Bank Statement"
                stats={reportStats}
                columns={columns}
                data={transactions}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                onExport={() => alert('Export feature coming soon')}
            />
        </ReportsLayout>
    );
}
