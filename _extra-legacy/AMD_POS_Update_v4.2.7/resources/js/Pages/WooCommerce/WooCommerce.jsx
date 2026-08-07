import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    RefreshCw,
    Settings,
    ShoppingCart,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Download,
    Upload,
    Package,
    Users
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

export default function WooCommerceSyncIndex({ settings = {}, lastSync = null }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const { showAlert } = useAlert();

    const handleSync = (type) => {
        setIsSyncing(true);
        // Simulate sync
        setTimeout(() => {
            setIsSyncing(false);
            showAlert({ title: 'Sync Completed', message: `${type} synced successfully with WooCommerce`, type: 'success' });
        }, 2000);
    };

    return (
        <OneGlanceLayout title="WooCommerce Sync" activeMenu="Marketing">
            <Head title="WooCommerce Integration" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <RefreshCw className="text-violet-600 dark:text-violet-400" size={24} />
                            </div>
                            WooCommerce Integration
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Sync products, orders, and customers with your WooCommerce store</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-sm font-medium ${settings.connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {settings.connected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {settings.connected ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                </div>

                {/* Connection Status Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                <ShoppingCart size={32} className="text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Store Connection</h3>
                                <p className="text-slate-500 text-sm">
                                    {settings.store_url || 'No store connected'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Last synced: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                                </p>
                            </div>
                        </div>
                        <button className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold flex items-center gap-2">
                            <Settings size={18} />
                            Configure Settings
                        </button>
                    </div>
                </div>

                {/* Sync Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Products Sync */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors group">
                        <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Package className="text-violet-600 dark:text-violet-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Products</h3>
                        <p className="text-slate-500 text-sm mb-6">Sync inventory levels, prices, and product details.</p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleSync('Products Export')}
                                disabled={isSyncing}
                                className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <span>Export to WooCommerce</span>
                                <Upload size={16} />
                            </button>
                            <button
                                onClick={() => handleSync('Products Import')}
                                disabled={isSyncing}
                                className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <span>Import from WooCommerce</span>
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Orders Sync */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Orders</h3>
                        <p className="text-slate-500 text-sm mb-6">Import new orders and update order statuses.</p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleSync('Orders Import')}
                                disabled={isSyncing}
                                className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <span>Import New Orders</span>
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => handleSync('Order Status Update')}
                                disabled={isSyncing}
                                className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <span>Update Statuses</span>
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Customers Sync */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Users className="text-emerald-600 dark:text-emerald-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Customers</h3>
                        <p className="text-slate-500 text-sm mb-6">Sync customer data and loyalty points.</p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleSync('Customers Import')}
                                disabled={isSyncing}
                                className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <span>Import Customers</span>
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => handleSync('Customers Export')}
                                disabled={isSyncing}
                                className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-slate-600 dark:text-slate-400"
                            >
                                <span>Export Customers</span>
                                <Upload size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
