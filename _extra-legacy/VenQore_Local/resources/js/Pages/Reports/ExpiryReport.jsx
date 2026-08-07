import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Calendar, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';

export default function ExpiryReport({ batches = [], stats = {}, filters = {} }) {
    const {
        store
    } = usePage().props;

    // Map Stats
    const reportStats = [
        {
            label: 'Expired Items',
            value: stats.expired_count,
            icon: <AlertTriangle size={18} />,
            type: 'down'
        },
        {
            label: 'Expiring Soon (30 Days)',
            value: stats.expiring_soon_count,
            icon: <Calendar size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Batches',
            value: stats.total_batches,
            icon: <Package size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Quantity',
            value: stats.total_quantity,
            icon: <CheckCircle size={18} />,
            type: 'neutral'
        }
    ];

    // Map Columns
    const columns = [
        {
            key: 'product_name',
            label: 'Product',
            sortable: true,
            render: (row) => (
                <div>
                    <div className="font-medium text-slate-900 dark:text-white">{row.product?.name}</div>
                    <div className="text-xs text-slate-500">Batch: {row.batch_number}</div>
                </div>
            )
        },
        {
            key: 'expiry_date',
            label: 'Expiry Date',
            sortable: true,
            render: (row) => {
                const date = new Date(row.expiry_date);
                const today = new Date();
                const diffTime = date - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let color = 'text-slate-600 dark:text-slate-400';
                if (diffDays < 0) color = 'text-red-600 dark:text-red-400 font-bold';
                else if (diffDays <= 30) color = 'text-amber-600 dark:text-amber-400 font-bold';
                else if (diffDays <= 90) color = 'text-blue-600 dark:text-blue-400';

                return <span className={color}>{date.toLocaleDateString('en-PK')} ({diffDays} days)</span>;
            }
        },
        {
            key: 'quantity',
            label: 'Quantity',
            align: 'right',
            sortable: true,
            render: (row) => <span className="font-medium">{row.quantity}</span>
        },
        {
            key: 'warehouse',
            label: 'Warehouse',
            render: (row) => row.warehouse?.name || '-'
        }
    ];

    // Filter Defs
    const filterDefs = [
        {
            key: 'days_threshold',
            type: 'select',
            label: 'Expires Within',
            options: [
                { value: '30', label: '30 Days' },
                { value: '60', label: '60 Days' },
                { value: '90', label: '90 Days' },
                { value: '180', label: '6 Months' },
                { value: '365', label: '1 Year' }
            ]
        }
    ];

    const handleFilterChange = (newValues) => {
        router.get(route("store.reports.expiry", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Expiry Report">
            <Head title="Expiry Report" />

            <MasterReport
                title="Expiry Report"
                stats={reportStats}
                columns={columns}
                data={batches}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                onExport={() => alert('Export feature coming soon')}
            />
        </ReportsLayout>
    );
}
