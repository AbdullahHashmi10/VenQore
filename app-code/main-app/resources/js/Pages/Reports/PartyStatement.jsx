import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Users, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function PartyStatement({ party, transactions = [], openingBalance = 0, filters = {}, parties = [] }) {
    const {
        store
    } = usePage().props;

    // Calculate Totals
    const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    // Logic: If Customer (Debtor), Balance = Opening + Sales (Debit) - Payments (Credit). 
    // If Supplier (Creditor), Balance = Opening + Purchases (Credit) - Payments (Debit).
    // However, the controller seems to send 'debit' and 'credit' as values.
    // Let's assume standard accounting: Asset/Expense is Dr, Liability/Income is Cr.
    // Customer is Asset. Supplier is Liability.

    // Controller logic seems to be: 
    // Invoice (Sale) -> Debit. Payment (Received) -> Credit.
    // Invoice (Purchase) -> Credit. Payment (Sent) -> Debit.
    // So Net = Debit - Credit for Customers.
    // And Net = Credit - Debit for Suppliers.

    // But Controller Opening Balance logic:
    // PartyStatement:316 $prevSales - $prevPaymentsIn (So Sales are positive, Payments negative).
    // This implies a "Net Debit" balance logic for customers.

    // Let's assume standard "Running Balance" is calculated from Opening + Debit - Credit.
    // If it's a supplier, it might be inverted visually, but mathematically:
    // Customer: Dr 1000 (Sale), Cr 500 (Pay). Bal = 500 Dr.
    // Supplier: Cr 1000 (Purchase), Dr 500 (Pay). Bal = -500 (or 500 Cr).

    // Visual Logic:
    let closingBalance = openingBalance + totalDebit - totalCredit;
    // IF opening balance was passed as "Receivable" (positive).
    // Controller: $prevSales - $prevPaymentsIn. So YES, positive means Receivable.

    // Map Stats
    const reportStats = party ? [
        {
            label: 'Opening Balance',
            value: formatCurrency(Math.abs(openingBalance)),
            subValue: openingBalance >= 0 ? 'Receivable (Dr)' : 'Payable (Cr)',
            icon: <ArrowRight size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Debits',
            value: formatCurrency(totalDebit),
            icon: <ArrowLeft size={18} />,
            type: 'neutral' // Debit isn't inherently good or bad without context
        },
        {
            label: 'Total Credits',
            value: formatCurrency(totalCredit),
            icon: <ArrowRight size={18} />,
            type: 'neutral'
        },
        {
            label: 'Closing Balance',
            value: formatCurrency(Math.abs(closingBalance)),
            subValue: closingBalance >= 0 ? 'Receivable (Dr)' : 'Payable (Cr)',
            icon: <CreditCard size={18} />,
            type: closingBalance > 0 ? 'up' : 'down'
        }
    ] : [];

    // Map Columns
    // Need running balance calculation for each row
    let runningBalance = openingBalance;
    const dataWithBalance = transactions.map(t => {
        runningBalance = runningBalance + (Number(t.debit) || 0) - (Number(t.credit) || 0);
        return { ...t, balance: runningBalance };
    });

    const columns = [
        {
            key: 'date',
            label: 'Date',
            type: 'date',
            sortable: true,
            render: (row) => new Date(row.date).toLocaleDateString('en-PK')
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => <span className="font-medium text-slate-700 dark:text-slate-300">{row.type}</span>
        },
        {
            key: 'ref',
            label: 'Reference',
            render: (row) => <span className="font-mono text-xs text-slate-500">{row.ref}</span>
        },
        {
            key: 'debit',
            label: 'Debit',
            align: 'right',
            render: (row) => row.debit > 0 ? <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(row.debit)}</span> : '-'
        },
        {
            key: 'credit',
            label: 'Credit',
            align: 'right',
            render: (row) => row.credit > 0 ? <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(row.credit)}</span> : '-'
        },
        {
            key: 'balance',
            label: 'Balance',
            align: 'right',
            render: (row) => {
                const isNegative = row.balance < 0;
                const label = isNegative ? 'Cr' : 'Dr';
                return (
                    <span className={`font-bold ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(Math.abs(row.balance))} {label}
                    </span>
                );
            }
        }
    ];

    // Filter Defs
    const filterDefs = [
        {
            key: 'party_id',
            type: 'select',
            label: 'Select Party',
            options: parties.map(p => ({ value: p.id, label: p.name }))
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
        router.get(route("store.reports.party-statement", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Party Statement">
            <Head title="Party Statement" />

            {!party ? (
                <div className="flex flex-col items-center justify-center h-[60vh] bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                        <Users size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a Party</h3>
                    <p className="text-slate-500 mb-6 text-center max-w-md">Please select a customer or supplier from the filters above to generate their detailed ledger statement.</p>

                    {/* Inline Filter for Quick Access */}
                    <div className="w-64">
                        <select
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            onChange={(e) => handleFilterChange({ ...filters, party_id: e.target.value })}
                        >
                            <option value="">Select Party...</option>
                            {parties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <MasterReport
                    title={`Statement: ${party.name}`}
                    stats={reportStats}
                    columns={columns}
                    data={dataWithBalance}
                    filters={filterDefs}
                    filterValues={filters}
                    onFilterChange={handleFilterChange}
                    onExport={() => alert('Export feature coming soon')}
                />
            )}
        </ReportsLayout>
    );
}
