import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    FileText,
    Search,
    Download,
    Plus,
    Truck,
    Globe,
    CheckCircle,
    XCircle,
    AlertTriangle,
    QrCode
} from 'lucide-react';

export default function EInvoicingIndex({ invoices = [] }) {
    const [activeTab, setActiveTab] = useState('e-invoice'); // 'e-invoice' or 'e-way-bill'

    return (
        <OneGlanceLayout title="E-Invoicing & E-Way Bill" activeMenu="Sales">
            <Head title="E-Invoicing" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                                <QrCode className="text-cyan-600 dark:text-cyan-400" size={24} />
                            </div>
                            E-Invoicing & E-Way Bill
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Generate and manage government mandated electronic documents</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('e-invoice')}
                            className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'e-invoice'
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            E-Invoices
                        </button>
                        <button
                            onClick={() => setActiveTab('e-way-bill')}
                            className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'e-way-bill'
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            E-Way Bills
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                                <FileText className="text-cyan-600 dark:text-cyan-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Generated Today</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Success Rate</p>
                                <p className="text-2xl font-black text-emerald-600">100%</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Pending Generation</p>
                                <p className="text-2xl font-black text-amber-600">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <XCircle className="text-red-600 dark:text-red-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Failed / Errors</p>
                                <p className="text-2xl font-black text-red-600">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab === 'e-invoice' ? 'E-Invoices' : 'E-Way Bills'}...`}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none"
                                />
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-bold shadow-lg shadow-cyan-500/20">
                            <Plus size={18} />
                            Generate New {activeTab === 'e-invoice' ? 'E-Invoice' : 'E-Way Bill'}
                        </button>
                    </div>
                </div>

                {/* Table Placeholder */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Doc Number</th>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Ack No / Bill No</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <QrCode size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                            <p className="text-slate-500 font-medium">No {activeTab === 'e-invoice' ? 'E-Invoices' : 'E-Way Bills'} found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    // Map invoices here
                                    null
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
