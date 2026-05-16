import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    History,
    ArrowUpRight,
    ArrowDownLeft,
    User,
    FileText,
    Package,
    Calendar,
    ArrowRightLeft,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';

export default function MovementHistory({ movements = [], filters = {}, products = [], warehouses = [] }) {
    const {
        store
    } = usePage().props;

    // Derived Statistics
    const stats = useMemo(() => {
        let totalIn = 0;
        let totalOut = 0;
        let mostActiveItemMap = {};

        movements.forEach(m => {
            const qty = Math.abs(parseFloat(m.quantity) || 0);
            const type = m.type || 'unknown';

            // Heuristic for In/Out
            const isIn = ['purchase', 'received', 'return', 'adjustment_in', 'production', 'transfer_in', 'in'].includes(type);

            if (isIn) totalIn += qty;
            else totalOut += qty;

            const prodId = m.product_id || m.product?.id;
            if (prodId) {
                mostActiveItemMap[prodId] = (mostActiveItemMap[prodId] || 0) + 1;
            }
        });

        // Find most active
        let mostActiveId = Object.keys(mostActiveItemMap).sort((a, b) => mostActiveItemMap[b] - mostActiveItemMap[a])[0];
        const mostActiveProduct = products.find(p => p.id == mostActiveId);

        return {
            totalIn,
            totalOut,
            netChange: totalIn - totalOut,
            mostActive: mostActiveProduct ? mostActiveProduct.name : 'N/A'
        };
    }, [movements]);

    // Chart Data: Movement Volume over Time (Group by Date)
    const chartData = useMemo(() => {
        const grouped = {};
        movements.slice().reverse().forEach(m => { // Process chronological if possible, assumes movements desc
            const date = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!grouped[date]) grouped[date] = { name: date, In: 0, Out: 0 };

            const qty = Math.abs(parseFloat(m.quantity) || 0);
            const isIn = ['purchase', 'received', 'return', 'adjustment_in', 'production', 'transfer_in', 'in'].includes(m.type);

            if (isIn) grouped[date].In += qty;
            else grouped[date].Out += qty;
        });
        return Object.values(grouped); // Returns array of objects
    }, [movements]);

    const chartConfig = {
        type: 'bar', // or 'area'
        bars: [
            { dataKey: 'In', fill: '#10b981', name: 'Inbound' },
            { dataKey: 'Out', fill: '#ef4444', name: 'Outbound' }
        ],
        xAxisKey: 'name'
    };

    const reportStats = [
        {
            label: 'Total Inbound',
            value: stats.totalIn,
            subValue: 'Units Received',
            icon: <ArrowDownLeft size={20} className="text-emerald-500" />,
            type: 'up'
        },
        {
            label: 'Total Outbound',
            value: stats.totalOut,
            subValue: 'Units Dispatched',
            icon: <ArrowUpRight size={20} className="text-red-500" />,
            type: 'down'
        },
        {
            label: 'Net Flow',
            value: stats.netChange > 0 ? `+${stats.netChange}` : stats.netChange,
            subValue: 'Inventory Impact',
            icon: <Activity size={20} className="text-blue-500" />,
            type: 'neutral'
        },
        {
            label: 'Most Active Item',
            value: stats.mostActive.substring(0, 15) + (stats.mostActive.length > 15 ? '...' : ''),
            subValue: 'Highest Frequency',
            icon: <Package size={20} className="text-orange-500" />,
            type: 'neutral'
        }
    ];

    // Helper for Type Styles
    const getTypeStyle = (type) => {
        switch (type) {
            case 'sale': return { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', icon: <TrendingUp size={14} />, label: 'Sale' };
            case 'purchase': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: <ArrowDownLeft size={14} />, label: 'Purchase' };
            case 'return': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: <ArrowRightLeft size={14} />, label: 'Return' };
            case 'adjustment_in': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: <TrendingUp size={14} />, label: 'Adjustment (+)' };
            case 'adjustment_out': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: <TrendingDown size={14} />, label: 'Adjustment (-)' };
            case 'damage': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-500', icon: <Activity size={14} />, label: 'Damage' };
            default: return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', icon: <Activity size={14} />, label: type?.replace('_', ' ') || 'Unknown' };
        }
    };

    // Columns
    const columns = [
        {
            key: 'created_at',
            label: 'Timeline',
            sortable: true,
            width: '180px',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        {new Date(row.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            key: 'product',
            label: 'Product Info',
            sortable: true,
            width: '280px',
            render: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {row.product?.image ? (
                            <img src={`/storage/${row.product.image}`} className="w-full h-full object-cover" alt="" onError={(e) => e.target.style.display = 'none'} />
                        ) : (
                            <Package size={16} className="text-slate-400" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1" title={row.product?.name}>{row.product?.name || 'Unknown Item'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{row.product?.sku || 'NO-SKU'}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Movement Type',
            sortable: true,
            render: (row) => {
                const style = getTypeStyle(row.type);
                return (
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-transparent ${style.bg} ${style.text} w-fit`}>
                        {style.icon}
                        <span className="text-xs font-bold capitalize">{style.label}</span>
                    </div>
                );
            }
        },
        {
            key: 'quantity',
            label: 'Volume',
            align: 'right',
            sortable: true,
            render: (row) => {
                const isIn = ['purchase', 'received', 'return', 'adjustment_in', 'production', 'transfer_in', 'in'].includes(row.type);
                const val = Math.abs(parseFloat(row.quantity) || 0);
                return (
                    <div className={`font-mono font-bold text-sm ${isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIn ? '+' : '-'}{val}
                    </div>
                );
            }
        },
        {
            key: 'reference',
            label: 'Reference',
            render: (row) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <FileText size={14} />
                    <span className="text-xs font-mono font-medium">
                        {row.reference_type ? row.reference_type.substring(0, 3).toUpperCase() : 'SYS'} #{row.reference_id}
                    </span>
                </div>
            )
        },
        {
            key: 'warehouse',
            label: 'Location',
            render: (row) => (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {row.warehouse?.name || 'Main'}
                </span>
            )
        },
        {
            key: 'user',
            label: 'Authorized By',
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {row.user?.name || 'System'}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {row.user?.name ? row.user.name.charAt(0) : 'S'}
                    </div>
                </div>
            )
        }
    ];

    const filterDefs = [
        {
            key: 'product_id',
            type: 'select',
            label: 'Product',
            options: products.map(p => ({ value: p.id, label: p.name }))
        },
        {
            key: 'warehouse_id',
            type: 'select',
            label: 'Warehouse',
            options: warehouses.map(w => ({ value: w.id, label: w.name }))
        },
        {
            key: 'type',
            type: 'select',
            label: 'Type',
            options: [
                { value: 'sale', label: 'Sale' },
                { value: 'purchase', label: 'Purchase' },
                { value: 'return', label: 'Return' },
                { value: 'adjustment_in', label: 'Adjustment (+)' },
                { value: 'adjustment_out', label: 'Adjustment (-)' },
            ]
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
        router.get(route("store.reports.movement-history", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="Stock Movement">
            <Head title="Movement History" />

            <MasterReport
                title="Stock Movement Log"
                subTitle="Audit trail of all inventory transactions"
                stats={reportStats}
                columns={columns}
                data={movements}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                chartData={chartData}
                chartConfig={chartConfig}
                onExport={() => alert('Exporting Movement History...')}
            />
        </ReportsLayout>
    );
}
