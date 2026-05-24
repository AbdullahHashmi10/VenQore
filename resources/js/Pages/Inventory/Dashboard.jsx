import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import MidnightNebula from '@/Components/MidnightNebula';
import { 
    Package, 
    TrendingUp, 
    ShoppingCart, 
    Wallet, 
    ArrowRight,
    DollarSign,
    Warehouse,
    AlertTriangle as AlertTriangleIcon
} from 'lucide-react';

export default function InventoryDashboard({ stats, topMoving }) {
    const { props } = usePage();
    const store = props.store || {};
    
    const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {subValue && (
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                        {subValue}
                    </span>
                )}
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">
                {value}
            </p>
        </div>
    );

    return (
        <OneGlanceLayout title="Inventory Dashboard" activeMenu="Stock">
            <Head title="Inventory Dashboard" />

            <div className="flex flex-col h-full">
                <StockModuleTabs activeTab="overview" />


                <div className="space-y-6 overflow-auto pb-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Products"
                            value={stats.total_products}
                            icon={Package}
                            color="bg-indigo-500"
                        />
                        <StatCard
                            title="Low Stock Items"
                            value={stats.low_stock_count}
                            icon={AlertTriangleIcon}
                            color="bg-amber-500"
                            subValue={stats.low_stock_count > 0 ? 'Action Needed' : 'Healthy'}
                        />
                        <StatCard
                            title="Inventory Value"
                            value={formatCurrency(stats.inventory_value || 0, store)}
                            icon={DollarSign}
                            color="bg-emerald-500"
                        />
                        <StatCard
                            title="Warehouses"
                            value={stats.total_warehouses}
                            icon={Warehouse}
                            color="bg-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Moving Items */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    Top Moving Items
                                </h3>
                                <Link href={route('store.reports.index', { store_slug: store?.slug })} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                    View Reports
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Product Name</th>
                                            <th className="px-6 py-4 font-medium text-right">Total Sold</th>
                                            <th className="px-6 py-4 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {topMoving.length > 0 ? (
                                            topMoving.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                                                        {item.total_sold}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            Popular
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-slate-400">
                                                    No sales data available yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions */}

                        <MidnightNebula className="rounded-2xl p-6 shadow-xl h-full" primaryColor="indigo" secondaryColor="purple">
                            <h3 className="font-bold text-xl mb-2 text-white">Quick Actions</h3>
                            <p className="text-indigo-100 mb-6 text-sm">Manage your inventory efficiently.</p>

                            <div className="space-y-3">
                                <Link href={route('store.inventory.index', { store_slug: store?.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                    <span className="font-medium">View All Products</span>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link href={route('store.stock-operations', { store_slug: store?.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                    <span className="font-medium">Stock Operations</span>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link href={route('store.purchase-orders.create', { store_slug: store?.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                    <span className="font-medium">Create Purchase Order</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </MidnightNebula>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
