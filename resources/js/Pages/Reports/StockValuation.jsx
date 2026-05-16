import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function StockValuation({ products = [], stats = {}, filters = {}, categories = [], warehouses = [] }) {
    const {
        store
    } = usePage().props;

    // Map Stats
    const reportStats = [
        {
            label: 'Total Stock Value (Cost)',
            value: formatCurrency(stats.total_cost_value),
            icon: <DollarSign size={18} />,
            type: 'up'
        },
        {
            label: 'Total Retail Value',
            value: formatCurrency(stats.total_retail_value),
            icon: <TrendingUp size={18} />,
            type: 'neutral'
        },
        {
            label: 'Potential Profit',
            value: formatCurrency(stats.potential_profit),
            icon: <DollarSign size={18} />,
            type: 'neutral'
        },
        {
            label: 'Total Items',
            value: stats.total_items,
            icon: <Package size={18} />,
            type: 'neutral'
        }
    ];

    // Map Columns
    const columns = [
        {
            key: 'name',
            label: 'Product',
            sortable: true,
            render: (row) => (
                <div>
                    <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.sku}</div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            sortable: true,
            render: (row) => row.category?.name || '-'
        },
        {
            key: 'remaining_qty',
            label: 'Qty (FIFO)',
            align: 'right',
            sortable: true,
            render: (row) => <span className="font-semibold">{row.stock_quantity}</span>
        },
        {
            key: 'unit_cost',
            label: 'FIFO Unit Cost',
            align: 'right',
            render: (row) => formatCurrency(row.unit_cost)
        },
        {
            key: 'sale_price',
            label: 'Sale Price',
            align: 'right',
            render: (row) => formatCurrency(row.sale_price)
        },
        {
            key: 'stock_value',
            label: 'Stock Value',
            align: 'right',
            sortable: true,
            render: (row) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.stock_value)}</span>
        },
        {
            key: 'retail_value',
            label: 'Retail Value',
            align: 'right',
            sortable: true,
            render: (row) => <span className="font-medium text-slate-600 dark:text-slate-400">{formatCurrency(row.retail_value)}</span>
        }
    ];

    // Filter Defs
    const filterDefs = [
        {
            key: 'category_id',
            type: 'select',
            label: 'Category',
            options: categories.map(c => ({ value: c.id, label: c.name }))
        },
        {
            key: 'warehouse_id',
            type: 'select',
            label: 'Warehouse',
            options: warehouses.map(w => ({ value: w.id, label: w.name }))
        }
    ];

    const handleFilterChange = (newValues) => {
        router.get(route("store.reports.stock-valuation", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Stock Valuation">
            <Head title="Stock Valuation" />

            <MasterReport
                title="Stock Valuation Report"
                stats={reportStats}
                columns={columns}
                data={products}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                onExport={() => alert('Export feature coming soon')}
            />
        </ReportsLayout>
    );
}
