import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ShoppingBag,
    Globe,
    Settings,
    Package,
    BarChart,
    ExternalLink,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';

export default function OnlineStoreIndex() {
    const [storeEnabled, setStoreEnabled] = useState(false);

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title="Online Store Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                <ShoppingBag className="text-indigo-600 dark:text-indigo-400" size={24} />
                            </div>
                            Online Store
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage your public storefront and settings</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Store Status: {storeEnabled ? 'Live' : 'Hidden'}
                        </span>
                        <button
                            onClick={() => setStoreEnabled(!storeEnabled)}
                            className={`text-3xl transition-colors ${storeEnabled ? 'text-emerald-500' : 'text-slate-300'}`}
                        >
                            {storeEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Settings Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                            <Settings className="text-slate-600 dark:text-slate-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Store Settings</h3>
                        <p className="text-slate-500 text-sm mb-4">Configure store name, logo, currency, and contact details.</p>
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium w-full">
                            Configure
                        </button>
                    </div>

                    {/* Products Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                            <Package className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Store Products</h3>
                        <p className="text-slate-500 text-sm mb-4">Select which products to display on your online store.</p>
                        <button className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors font-medium w-full">
                            Manage Products
                        </button>
                    </div>

                    {/* Visit Store Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <Globe className="text-white" size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">My Public Store</h3>
                        <p className="text-white/80 text-sm mb-4">Visit your live store as a customer sees it.</p>
                        <a href="#" className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition-colors font-bold w-full">
                            Visit Store <ExternalLink size={16} />
                        </a>
                    </div>
                </div>

                {/* Coming Soon Section */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">More Features Coming Soon</h3>
                    <p className="text-slate-500 mt-2">Themes, Custom Domain, and Advanced SEO tools will be available in the next update.</p>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
