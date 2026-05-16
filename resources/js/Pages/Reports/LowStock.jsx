import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, Package, ArrowDown, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function LowStock({ products = [], stats = {}, filters = {}, categories = [], warehouses = [] }) {
    const {
        store
    } = usePage().props;

    // Derived Calculations (Safety Checks)
    const totalShortage = products.reduce((acc, p) => acc + Math.max(0, (p.effective_threshold || p.alert_quantity || 0) - (p.stock_quantity || 0)), 0);
    // avg_unit_cost = weighted average unit cost from inventory_batches (FIFO-sourced, sent by backend)
    // cost_price is fallback only if avg_unit_cost is not yet provided
    const estimatedReorderCost = products.reduce((acc, p) => acc + (Math.max(0, (p.effective_threshold || p.alert_quantity || 0) - (p.stock_quantity || 0)) * (p.avg_unit_cost ?? p.cost_price ?? 0)), 0);

    // Map Stats
    const reportStats = [
        {
            label: 'Critical Shortages',
            value: stats.out_of_stock_count || products.filter(p => p.stock_quantity <= 0).length,
            subValue: 'Out of Stock',
            icon: <AlertTriangle size={20} className="text-red-500" />,
            type: 'down' // Red indicator
        },
        {
            label: 'Low Stock Alerts',
            value: stats.low_stock_count || products.length,
            subValue: 'Below Min. Level',
            icon: <Package size={20} className="text-orange-500" />,
            type: 'neutral'
        },
        {
            label: 'Total Units Needed',
            value: totalShortage,
            subValue: 'To restore min. levels',
            icon: <ArrowDown size={20} className="text-blue-500" />,
            type: 'neutral'
        },
        {
            label: 'Est. Reorder Cost',
            value: formatCurrency(estimatedReorderCost),
            subValue: 'Based on Cost Price',
            icon: <DollarSign size={20} className="text-emerald-500" />,
            type: 'up'
        }
    ];

    // Chart Data: Top 10 Shortagonists
    const chartData = products
        .map(p => ({
            name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
            full_name: p.name,
            Shortage: Math.max(0, (p.effective_threshold || p.alert_quantity || 0) - (p.stock_quantity || 0)),
            Current: p.stock_quantity || 0
        }))
        .sort((a, b) => b.Shortage - a.Shortage)
        .slice(0, 10);

    const chartConfig = {
        type: 'bar',
        bars: [
            { dataKey: 'Current', fill: '#94a3b8', name: 'Current Stock' },
            { dataKey: 'Shortage', fill: '#ef4444', name: 'Shortage Qty' }
        ],
        xAxisKey: 'name'
    };

    // Columns
    const columns = [
        {
            key: 'name',
            label: 'Product Details',
            sortable: true,
            width: '320px',
            render: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {row.image ? (
                            <img src={`/storage/${row.image}`} className="w-full h-full object-cover" alt={row.name} onError={(e) => e.target.style.display = 'none'} />
                        ) : (
                            <Package size={18} className="text-slate-400" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1" title={row.name}>{row.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                            <span>{row.sku}</span>
                            {row.category && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700">
                                    {row.category.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'stock_quantity',
            label: 'Stock Health',
            sortable: true,
            width: '200px',
            render: (row) => {
                const stock = row.stock_quantity || 0;
                const min = row.effective_threshold || row.alert_quantity || 0;
                // Percentage logic: 0% is empty, 50% is at min level, 100% is safe (2x min)
                const safeLevel = min * 2 || 10;
                const percentage = Math.min(100, Math.max(0, (stock / safeLevel) * 100));

                let colorClass = 'bg-emerald-500';
                if (stock === 0) colorClass = 'bg-red-500';
                else if (stock < min) colorClass = 'bg-orange-500';

                return (
                    <div className="w-full max-w-[160px]">
                        <div className="flex justify-between text-[11px] mb-1 font-bold">
                            <span className={stock === 0 ? 'text-red-500' : (stock < min ? 'text-orange-500' : 'text-emerald-500')}>
                                {stock} units
                            </span>
                            <span className="text-slate-400">Min: {min}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className={`h-full ${colorClass} transition-all duration-500 relative`} style={{ width: `${percentage}%` }}>
                                {stock < min && <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50 animate-pulse"></div>}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'shortage',
            label: 'To Order',
            align: 'center',
            sortable: true,
            render: (row) => {
                const shortage = Math.max(0, (row.effective_threshold || row.alert_quantity || 0) - (row.stock_quantity || 0));
                return (
                    <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                            +{shortage}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">units needed</span>
                    </div>
                );
            }
        },
        {
            key: 'cost',
            label: 'Est. Reorder Cost',
            align: 'right',
            render: (row) => {
                const shortage = Math.max(0, (row.min_stock_alert || 0) - (row.stock_quantity || 0));
                // Use FIFO avg_unit_cost sent by backend; fallback to cost_price only if missing
                const unitCost = row.avg_unit_cost ?? row.cost_price ?? 0;
                const cost = unitCost * shortage;
                return (
                    <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                        {formatCurrency(cost)}
                    </div>
                );
            }
        },
        {
            key: 'supplier',
            label: 'Supplier',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {row.supplier?.name || 'Any'}
                    </span>
                </div>
            )
        },
        {
            key: 'action',
            label: 'Action',
            align: 'right',
            render: (row) => (
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-600 hover:text-indigo-700 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group" title="Create Purchase Order">
                    <ShoppingCart size={16} className="group-hover:scale-110 transition-transform" />
                </button>
            )
        }
    ];

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
        router.get(route("store.reports.low-stock", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Low Stock Report">
            <Head title="Low Stock Report" />

            <MasterReport
                title="Low Stock Analysis"
                subTitle="Critical inventory levels and replenishment needs"
                stats={reportStats}
                columns={columns}
                data={products}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                chartData={chartData}
                chartConfig={chartConfig}
                onExport={() => alert('Exporting Low Stock Report...')}
            />
        </ReportsLayout>
    );
}
