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
            value: formatCurrency(stats.total_cost_value, store),
            icon: <DollarSign size={18} />,
            type: 'up'
        },
        {
            label: 'Total Retail Value',
            value: formatCurrency(stats.total_retail_value, store),
            icon: <TrendingUp size={18} />,
            type: 'neutral'
        },
        {
            label: 'Potential Profit',
            value: formatCurrency(stats.potential_profit, store),
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
            render: (row) => formatCurrency(row.unit_cost, store)
        },
        {
            key: 'sale_price',
            label: 'Sale Price',
            align: 'right',
            render: (row) => formatCurrency(row.sale_price, store)
        },
        {
            key: 'stock_value',
            label: 'Stock Value',
            align: 'right',
            sortable: true,
            render: (row) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.stock_value, store)}</span>
        },
        {
            key: 'retail_value',
            label: 'Retail Value',
            align: 'right',
            sortable: true,
            render: (row) => <span className="font-medium text-slate-600 dark:text-slate-400">{formatCurrency(row.retail_value, store)}</span>
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

    const handleExport = (type) => {
        console.log('StockValuation handleExport called with type:', type);
        console.log('Current products count:', products?.length);

        if (type === 'print') {
            window.print();
            return;
        }

        if (type === 'csv') {
            if (!products || products.length === 0) {
                alert('No data available to export.');
                return;
            }

            const csvRows = [];
            // Header
            csvRows.push(['Product', 'SKU', 'Category', 'Quantity', 'FIFO Unit Cost', 'Sale Price', 'Stock Value (Cost)', 'Retail Value'].join(','));

            // Data
            products.forEach(row => {
                csvRows.push([
                    `"${row.name}"`,
                    `"${row.sku}"`,
                    `"${row.category?.name || ''}"`,
                    row.stock_quantity,
                    row.unit_cost,
                    row.sale_price,
                    row.stock_value,
                    row.retail_value
                ].join(','));
            });

            console.log('Generated CSV rows:', csvRows.length);
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `stock_valuation_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('Download triggered.');
        }
    };

    return (
        <ReportsLayout title="Stock Valuation">
            <Head title="Stock Valuation" />

            <div className="print:hidden">
                <MasterReport
                    title="Stock Valuation Report"
                    stats={reportStats}
                    columns={columns}
                    data={products}
                    filters={filterDefs}
                    filterValues={filters}
                    onFilterChange={handleFilterChange}
                    onExport={handleExport}
                />
            </div>

            {/* Print View Styling */}
            <div className="hidden print:block p-8">
                <div className="text-center mb-10 border-b-2 border-slate-900 pb-6">
                    <h1 className="text-3xl font-black">{store.name}</h1>
                    <h2 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-2">Stock Valuation Report</h2>
                    <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-10">
                    {reportStats.map((s, idx) => (
                        <div key={idx} className="border p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                            <p className="text-xl font-black">{s.value}</p>
                        </div>
                    ))}
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="py-2 text-xs font-bold uppercase">Product / SKU</th>
                            <th className="py-2 text-xs font-bold uppercase text-right">Qty</th>
                            <th className="py-2 text-xs font-bold uppercase text-right">Cost</th>
                            <th className="py-2 text-xs font-bold uppercase text-right">Valuation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y border-b">
                        {products.map((row, idx) => (
                            <tr key={idx}>
                                <td className="py-3">
                                    <div className="font-bold">{row.name}</div>
                                    <div className="text-[10px] text-slate-500">{row.sku}</div>
                                </td>
                                <td className="py-3 text-right font-bold">{row.stock_quantity}</td>
                                <td className="py-3 text-right">{formatCurrency(row.unit_cost, store)}</td>
                                <td className="py-3 text-right font-black">{formatCurrency(row.stock_value, store)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReportsLayout>
    );
}
