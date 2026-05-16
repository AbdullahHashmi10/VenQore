import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Hourglass,
    AlertTriangle,
    DollarSign,
    Package,
    Archive,
    Calendar,
    RefreshCw
} from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';

export default function StockAging({ batches = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    // Derived Statistics
    const stats = useMemo(() => {
        let totalValue = 0;
        let deadStockValue = 0; // > 180 days
        let slowMovingValue = 0; // 90-180 days
        let freshStockValue = 0; // < 90 days

        // cost_value is pre-computed by backend as remaining_qty * unit_cost (FIFO locked)
        // NEVER compute quantity * cost_price here — that is the old phantom math
        batches.forEach(b => {
            const val = parseFloat(b.cost_value) || 0;
            const days = parseInt(b.days) || 0;
            totalValue += val;

            if (days > 180) deadStockValue += val;
            else if (days > 90) slowMovingValue += val;
            else freshStockValue += val;
        });

        return {
            totalValue,
            deadStockValue,
            slowMovingValue,
            freshStockValue,
            deadStockPercent: totalValue > 0 ? (deadStockValue / totalValue) * 100 : 0
        };
    }, [batches]);

    // Chart Data: Stock Value by Age Group
    const chartData = [
        { name: 'Fresh (0-90 Days)', value: stats.freshStockValue, fill: '#10b981' },
        { name: 'Slow (90-180 Days)', value: stats.slowMovingValue, fill: '#f59e0b' },
        { name: 'Dead (180+ Days)', value: stats.deadStockValue, fill: '#ef4444' }
    ];

    const chartConfig = {
        type: 'pie', // Using Donut/Pie chart for distribution
        dataKey: 'value',
        nameKey: 'name',
        innerRadius: 60,
        outerRadius: 100
    };

    // Fallback Bar Chart if Pie isn't desired
    // MasterReport supports 'bar', 'area', 'pie'. Let's stick to bar for value comparison.
    const barChartData = [
        { name: 'Fresh', Value: stats.freshStockValue, fill: '#10b981' },
        { name: 'Slow', Value: stats.slowMovingValue, fill: '#f59e0b' },
        { name: 'Dead', Value: stats.deadStockValue, fill: '#ef4444' }
    ];
    const barChartConfig = {
        type: 'bar',
        bars: [{ dataKey: 'Value', name: 'Stock Value (PKR)' }],
        xAxisKey: 'name'
    };


    const reportStats = [
        {
            label: 'Total Inventory Value',
            value: new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(stats.totalValue),
            subValue: 'Across all batches',
            icon: <DollarSign size={20} className="text-slate-500" />,
            type: 'neutral'
        },
        {
            label: 'Capital in Dead Stock',
            value: new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(stats.deadStockValue),
            subValue: '> 180 Days Old',
            icon: <Archive size={20} className="text-red-500" />,
            type: 'down'
        },
        {
            label: 'Slow Moving Capital',
            value: new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(stats.slowMovingValue),
            subValue: '90-180 Days Old',
            icon: <Hourglass size={20} className="text-orange-500" />,
            type: 'neutral'
        },
        {
            label: 'Inventory Health',
            value: `${(100 - stats.deadStockPercent).toFixed(1)}%`,
            subValue: 'Fresh Stock Ratio',
            icon: <RefreshCw size={20} className="text-emerald-500" />,
            type: 'up'
        }
    ];

    // Helper for Status
    const getStatus = (days) => {
        if (days > 180) return { label: 'Dead Stock', class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900' };
        if (days > 90) return { label: 'Slow Moving', class: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900' };
        if (days > 30) return { label: 'Stable', class: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900' };
        return { label: 'Fresh', class: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' };
    };

    // Columns
    const columns = [
        {
            key: 'product',
            label: 'Inventory Item',
            sortable: true,
            width: '300px',
            render: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <Package size={16} className="text-slate-400" />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{row.product}</div>
                        <div className="text-[10px] font-mono text-slate-500">Batch: {row.batch || 'N/A'}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'days',
            label: 'Age',
            sortable: true,
            width: '180px',
            render: (row) => {
                const days = parseInt(row.days) || 0;
                const percentage = Math.min(100, (days / 365) * 100);
                const color = days > 180 ? 'bg-red-500' : days > 90 ? 'bg-orange-500' : 'bg-emerald-500';

                return (
                    <div className="w-full max-w-[140px]">
                        <div className="flex justify-between text-[11px] mb-1 font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{days} days</span>
                            <span className="text-slate-400">Target: 90</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'category',
            label: 'Status',
            sortable: true,
            render: (row) => {
                const status = getStatus(parseInt(row.days));
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.class} uppercase tracking-wide`}>
                        {status.label}
                    </span>
                );
            }
        },
        {
            key: 'quantity',
            label: 'Qty On Hand',
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                    {row.quantity}
                </span>
            )
        },
        {
            key: 'cost_value',
            label: 'Asset Value (FIFO)',
            align: 'right',
            sortable: true,
            render: (row) => {
                // cost_value = remaining_qty * unit_cost from inventory_batches (authoritative)
                const val = parseFloat(row.cost_value) || 0;
                return (
                    <div className="font-mono font-bold text-sm text-slate-800 dark:text-white">
                        {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val)}
                    </div>
                );
            }
        }
    ];

    const filterDefs = [
        {
            key: 'category', // Using existing backend key 'category' which likely maps to age bucket
            type: 'select',
            label: 'Age Group',
            options: [
                { value: '0-30', label: '0-30 Days (Fresh)' },
                { value: '30-90', label: '30-90 Days (Stable)' },
                { value: '90-180', label: '90-180 Days (Slow)' },
                { value: '180+', label: '180+ Days (Dead)' }
            ]
        }
    ];

    const handleFilterChange = (newValues) => {
        router.get(route("store.reports.stock-aging", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Stock Aging Analysis">
            <Head title="Stock Aging Report" />

            <MasterReport
                title="Stock Aging Report"
                subTitle="Identify liquidity risks and dead stock capital"
                stats={reportStats}
                columns={columns}
                data={batches}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                chartData={barChartData}
                chartConfig={barChartConfig}
                onExport={() => alert('Exporting Stock Aging Report...')}
            />
        </ReportsLayout>
    );
}
