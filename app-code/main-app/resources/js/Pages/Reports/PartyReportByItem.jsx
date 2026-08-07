import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { formatCurrency } from '@/Utils/format';
import { PackageSearch } from 'lucide-react';

export default function PartyReportByItem({ data = [], stats = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const columns = [
        {
            key: 'product_name',
            label: 'Product',
            sortable: true,
        },
        {
            key: 'party_name',
            label: 'Customer',
            sortable: true,
        },
        {
            key: 'quantity',
            label: 'Qty',
            align: 'center',
            sortable: true,
        },
        {
            key: 'total',
            label: 'Net Revenue',  // ← was subtotal. Now reads net_amount from the waterfall.
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className="font-bold text-slate-800 dark:text-white">
                    {formatCurrency(row.total)}
                </span>
            )
        }
    ];

    const filterDefs = [
        { key: 'start_date', type: 'date', label: 'Start Date' },
        { key: 'end_date', type: 'date', label: 'End Date' },
    ];

    const handleFilterChange = (newValues) => {
        router.get(route("store.reports.party-report-by-item", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Customer Report by Item">
            <Head title="Customer Report by Item" />
            <MasterReport
                title="Customer Report by Item"
                subTitle="Net revenue per customer, grouped by product — FIFO reconciled"
                stats={stats}
                columns={columns}
                data={data}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
            />
        </ReportsLayout>
    );
}
