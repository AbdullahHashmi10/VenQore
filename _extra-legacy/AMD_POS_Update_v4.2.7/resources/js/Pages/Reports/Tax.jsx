import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Landmark, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function TaxReport({ tax_records = [], stats = {}, filters = {} }) {
    const {
        store
    } = usePage().props;

    // Map Stats
    const reportStats = [
        {
            label: 'Net Tax Payable',
            value: formatCurrency(stats.net_tax),
            subValue: stats.net_tax >= 0 ? 'Payable' : 'Refundable',
            icon: <Landmark size={18} />,
            type: stats.net_tax >= 0 ? 'down' : 'up' // Payable is bad (red/down), Refundable is good (green/up)
        },
        {
            label: 'Output Tax',
            value: formatCurrency(stats.total_output_tax),
            icon: <TrendingUp size={18} />,
            type: 'up'
        },
        {
            label: 'Input Tax',
            value: formatCurrency(stats.total_input_tax),
            icon: <TrendingDown size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Taxable',
            value: formatCurrency(stats.total_taxable),
            icon: <Percent size={18} />,
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
            key: 'invoice_number',
            label: 'Invoice #',
            render: (row) => <span className="font-mono text-xs text-slate-500">{row.invoice_number}</span>
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'sale' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                    {row.type === 'sale' ? 'Output Tax (Sales)' : 'Input Tax (Purchase)'}
                </span>
            )
        },
        {
            key: 'taxable_amount',
            label: 'Taxable Amt',
            align: 'right',
            sortable: true,
            render: (row) => formatCurrency(row.taxable_amount)
        },
        {
            key: 'tax_amount',
            label: 'Tax Amount',
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className={`font-bold ${row.type === 'sale' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formatCurrency(row.tax_amount)}
                </span>
            )
        }
    ];

    // Filter Defs
    const filterDefs = [
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
        router.get(route("store.reports.tax", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Tax Report">
            <Head title="Tax Report" />

            <MasterReport
                title="Tax Report"
                stats={reportStats}
                columns={columns}
                data={tax_records}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                onExport={() => alert('Export feature coming soon')}
            />
        </ReportsLayout>
    );
}
