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

export default function InventoryDashboard({ stats, topMoving, expiringBatches = [] }) {
    const { props } = usePage();
    const store = props.store || {};
    
    const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    {subValue && (
                        <span className="text-2xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">
                            {subValue}
                        </span>
                    )}
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
            </div>
            <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">
                {value}
            </p>
        </div>
    );
 
    return (
        <OneGlanceLayout title="Inventory Dashboard" activeMenu="Stock">
            <Head title="Inventory Dashboard" />
 
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-2 overflow-y-auto md:overflow-hidden">
                <StockModuleTabs activeTab="overview" />
 
                <div className="space-y-4 md:space-y-6 overflow-y-auto pb-24 md:pb-6 pr-1">
                    {/* Stats Grid - Responsive 2 Columns on Mobile */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
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
 
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Top Moving Items */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-extrabold text-sm md:text-lg text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                                    Top Moving Items
                                </h3>
                                <Link href={route('store.reports.index', { store_slug: store?.slug })} className="text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-bold uppercase">
                                    View Reports
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs md:text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-2xs">
                                        <tr>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold">Product Name</th>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-right">Total Sold</th>
                                            <th className="px-4 py-3 md:px-6 md:py-4 font-bold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                        {topMoving.length > 0 ? (
                                            topMoving.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-slate-800 dark:text-white">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-4 py-3 md:px-6 md:py-4 text-right text-slate-600 dark:text-slate-300 font-black">
                                                        {item.total_sold}
                                                    </td>
                                                    <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                            Popular
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-slate-400 font-semibold">
                                                    No sales data available yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
 
                        {/* Quick Actions & Expiry Warnings */}
                        <div className="space-y-4 md:space-y-6">
                            {expiringBatches.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-rose-950/30 p-4 md:p-6 shadow-sm">
                                    <h3 className="font-extrabold text-sm md:text-md text-rose-600 dark:text-rose-400 flex items-center gap-2 uppercase tracking-wider mb-3">
                                        <AlertTriangleIcon className="w-4 h-4 md:w-5 md:h-5 text-rose-500 animate-pulse" />
                                        Batch Expiry Alerts
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {expiringBatches.map((batch) => (
                                            <div key={batch.id} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100/50 dark:border-rose-950/20 text-xs">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">{batch.product_name}</div>
                                                <div className="flex justify-between text-slate-500 dark:text-slate-400 mt-1">
                                                    <span>Batch: {batch.batch_number || 'N/A'}</span>
                                                    <span className="font-bold text-rose-600 dark:text-rose-400">Exp: {batch.expiry_date}</span>
                                                </div>
                                                <div className="text-slate-400 text-2xs mt-0.5">Remaining Stock: {batch.remaining_qty} units</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <MidnightNebula className="rounded-2xl p-4 md:p-6 shadow-xl" primaryColor="indigo" secondaryColor="purple">
                                <h3 className="font-black text-lg md:text-xl mb-1 text-white uppercase tracking-wider">Quick Actions</h3>
                                <p className="text-indigo-100 mb-4 md:mb-6 text-xs font-semibold">Manage your inventory efficiently.</p>
 
                                <div className="space-y-2 md:space-y-3">
                                    <Link href={route('store.inventory.index', { store_slug: store?.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white text-xs md:text-sm font-bold">
                                        <span>View All Products</span>
                                        <ArrowRight size={16} />
                                    </Link>
                                    <Link href={route('store.stock-operations', { store_slug: store?.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white text-xs md:text-sm font-bold">
                                        <span>Stock Operations</span>
                                        <ArrowRight size={16} />
                                    </Link>
                                    <Link href={route('store.purchase-orders.create', { store_slug: store?.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white text-xs md:text-sm font-bold">
                                        <span>Create Purchase Order</span>
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </MidnightNebula>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
