import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { formatCurrency } from '@/Utils/format';
import { UserPlus } from 'lucide-react';

export default function ItemReportByParty({ data = [], stats = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const columns = [
        {
            key: 'party_name',
            label: 'Customer',
            sortable: true,
        },
        {
            key: 'product_name',
            label: 'Product',
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
        router.get(route("store.reports.item-report-by-party", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Item Report by Customer">
            <Head title="Item Report by Customer" />
            <MasterReport
                title="Item Report by Customer"
                subTitle="Net revenue per product, grouped by customer — FIFO reconciled"
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
