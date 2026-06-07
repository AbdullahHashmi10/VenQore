import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PremiumButton from '@/Components/PremiumButton';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Users, Package } from 'lucide-react';

const DataCard = ({ title, description, icon: Icon, exportRoute, importRoute, templateType, colorClass }) => {
    const { data, setData, post, progress, processing, errors, reset } = useForm({
        file: null,
    });
    const [successMessage, setSuccessMessage] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route(importRoute), {
            onSuccess: () => {
                reset();
                setSuccessMessage('Import successful!');
                setTimeout(() => setSuccessMessage(null), 5000);
            },
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-xl ${colorClass}`}>
                    <Icon size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
            </div>

            {successMessage && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                    <CheckCircle size={16} />
                    {successMessage}
                </div>
            )}

            <div className="flex-1 space-y-6">
                {/* Export Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Download size={16} /> Export Data
                    </h4>
                    <div className="flex flex-col gap-2">
                        <a href={route(exportRoute)} className="w-full">
                            <PremiumButton className="w-full justify-center" variant="secondary">
                                Download Current Data
                            </PremiumButton>
                        </a>
                        <a href={route('store.import.template', templateType)} className="w-full text-center text-xs text-indigo-500 hover:underline">
                            Download Blank Template
                        </a>
                    </div>
                </div>

                {/* Import Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Upload size={16} /> Import Data
                    </h4>
                    <form onSubmit={submit} className="space-y-3">
                        <label className="block w-full cursor-pointer bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 hover:border-indigo-500 transition-colors">
                            <span className="text-xs text-slate-500 dark:text-slate-400 block text-center truncate">
                                {data.file ? data.file.name : 'Select .xlsx or .csv file'}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={e => setData('file', e.target.files[0])}
                                accept=".xlsx,.csv"
                            />
                        </label>
                        {errors.file && (
                            <div className="text-red-500 text-xs flex items-center gap-1 justify-center">
                                <AlertCircle size={12} /> {errors.file}
                            </div>
                        )}
                        {progress && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                            </div>
                        )}
                        <PremiumButton type="submit" disabled={processing || !data.file} className="w-full justify-center text-sm py-2">
                            {processing ? 'Processing...' : 'Start Import'}
                        </PremiumButton>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function ImportExportIndex() {
    return (
        <OneGlanceLayout title="Import / Export">
            <Head title="Import / Export" />

            <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Management</h2>
                        <p className="text-slate-500 dark:text-slate-400">Backup, migrate, and bulk-update your system data.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DataCard
                        title="Products & Stock"
                        description="Manage inventory items, prices, and opening stock levels."
                        icon={Package}
                        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        exportRoute="products.export"
                        importRoute="products.import"
                        templateType="products"
                    />

                    <DataCard
                        title="Parties (Customers & Suppliers)"
                        description="Manage customer and supplier profiles and opening balances."
                        icon={Users}
                        colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                        exportRoute="parties.export"
                        importRoute="parties.import"
                        templateType="parties"
                    />
                </div>
            </div>
        </OneGlanceLayout>
    );
}
