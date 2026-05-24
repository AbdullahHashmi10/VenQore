import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, ArrowRight, Download, ArrowLeft, CreditCard } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function AccountLedger({ account, transactions = [], openingBalance = 0, filters = {}, accounts = [] }) {
    const {
        store
    } = usePage().props;

    // Calculate Totals
    const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : openingBalance;

    // Map Stats
    const reportStats = account ? [
        {
            label: 'Opening Balance',
            value: formatCurrency(openingBalance),
            icon: <BookOpen size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Debits',
            value: formatCurrency(totalDebit),
            icon: <ArrowLeft size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Credits',
            value: formatCurrency(totalCredit),
            icon: <ArrowRight size={18} />,
            type: 'neutral'
        },
        {
            label: 'Closing Balance',
            value: formatCurrency(closingBalance),
            icon: <CreditCard size={18} />,
            type: 'neutral'
        }
    ] : [];

    // Map Columns
    const columns = [
        {
            key: 'date',
            label: 'Date',
            type: 'date',
            render: (row) => row.type === 'opening' ? <span className="italic text-slate-400">{filters.start_date || '-'}</span> : new Date(row.date).toLocaleDateString('en-PK')
        },
        {
            key: 'reference',
            label: 'Reference',
            render: (row) => <span className="font-mono text-xs text-slate-500">{row.reference || '-'}</span>
        },
        {
            key: 'description',
            label: 'Description',
            render: (row) => row.type === 'opening' ? <span className="italic font-medium text-slate-500">Opening Balance</span> : <span className="text-slate-700 dark:text-slate-300">{row.description}</span>
        },
        {
            key: 'debit',
            label: 'Debit',
            align: 'right',
            render: (row) => row.debit > 0 ? formatCurrency(row.debit) : '-'
        },
        {
            key: 'credit',
            label: 'Credit',
            align: 'right',
            render: (row) => row.credit > 0 ? formatCurrency(row.credit) : '-'
        },
        {
            key: 'balance',
            label: 'Balance',
            align: 'right',
            render: (row) => <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(row.balance)}</span>
        }
    ];

    // Filter Defs
    const filterDefs = [
        {
            key: 'account_id',
            type: 'select',
            label: 'Account',
            options: accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))
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
        router.get(route("store.reports.account-ledger", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    // Prepare Data (Insert Opening Row)
    const reportData = account ? [
        { id: 'op', type: 'opening', balance: openingBalance },
        ...transactions
    ] : [];

    return (
        <ReportsLayout title="Account Ledger">
            <Head title="Account Ledger" />

            {!account ? (
                <div className="flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <BookOpen size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select an Account</h3>
                    <p className="text-slate-500 mb-6 text-center max-w-md">Please select an account from the filters above to view its detailed general ledger transactions.</p>

                    {/* Inline Filter */}
                    <div className="w-64">
                        <select
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            onChange={(e) => handleFilterChange({ ...filters, account_id: e.target.value })}
                        >
                            <option value="">Select Account...</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <MasterReport
                    title={account ? `${account.name} Ledger` : "General Ledger"}
                    stats={reportStats}
                    columns={columns}
                    data={reportData}
                    filters={filterDefs}
                    filterValues={filters}
                    onFilterChange={handleFilterChange}
                    onExport={() => alert('Export feature coming soon')}
                />
            )}
        </ReportsLayout>
    );
}
