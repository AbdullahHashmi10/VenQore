import React, { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { BookOpen, ArrowLeft, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChequeBookCreate({ bankAccounts = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        bank_account_id: bankAccounts.length === 1 ? bankAccounts[0].id : '',
        series_prefix: '',
        start_number: '',
        end_number: '',
        padding_zeros: '6',
        description: '',
    });

    const totalLeaves = useMemo(() => {
        const start = parseInt(data.start_number, 10);
        const end = parseInt(data.end_number, 10);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
            return end - start + 1;
        }
        return 0;
    }, [data.start_number, data.end_number]);

    const previewSerials = useMemo(() => {
        const start = parseInt(data.start_number, 10);
        const end = parseInt(data.end_number, 10);
        const pad = parseInt(data.padding_zeros, 10) || 6;
        const prefix = data.series_prefix ? data.series_prefix.trim().toUpperCase() + '-' : '';

        if (!isNaN(start) && !isNaN(end) && end >= start) {
            const first = prefix + String(start).padStart(pad, '0');
            const last = prefix + String(end).padStart(pad, '0');
            return { first, last };
        }
        return null;
    }, [data.start_number, data.end_number, data.series_prefix, data.padding_zeros]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.banking.cheque-books.store'));
    };

    return (
        <OneGlanceLayout>
            <Head title="Register Chequebook" />

            <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('store.banking.cheque-books.index')}
                        className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-brand-600" />
                            Register Bank Chequebook
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Register a new physical chequebook received from your bank.
                        </p>
                    </div>
                </div>

                {/* Subnavigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" />

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm space-y-6">
                    {errors.error && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                            <div>
                                <p className="font-semibold">Unable to register chequebook</p>
                                <p>{errors.error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bank Account */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                                Bank Account <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.bank_account_id}
                                onChange={(e) => setData('bank_account_id', e.target.value)}
                                className={`w-full rounded-lg border py-2.5 px-3 text-sm bg-neutral-50 dark:bg-neutral-900/50 ${
                                    errors.bank_account_id ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                                }`}
                                required
                            >
                                <option value="">-- Select Bank Account --</option>
                                {bankAccounts.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.bank_name}) {b.account_number ? `— #${b.account_number}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.bank_account_id && (
                                <p className="text-xs text-red-500 mt-1">{errors.bank_account_id}</p>
                            )}
                        </div>

                        {/* Series Prefix */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                                Series Prefix <span className="text-xs font-normal text-neutral-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. CHK, HBL"
                                value={data.series_prefix}
                                onChange={(e) => setData('series_prefix', e.target.value.toUpperCase())}
                                maxLength={10}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm uppercase bg-neutral-50 dark:bg-neutral-900/50"
                            />
                            <p className="text-2xs text-neutral-400 mt-1">Leading letters printed on the cheque leaves.</p>
                        </div>

                        {/* Padding Zeros */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                                Display Digit Length (Padding)
                            </label>
                            <select
                                value={data.padding_zeros}
                                onChange={(e) => setData('padding_zeros', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm bg-neutral-50 dark:bg-neutral-900/50"
                            >
                                <option value="4">4 Digits (e.g. 0001)</option>
                                <option value="6">6 Digits (e.g. 000001) - Standard</option>
                                <option value="8">8 Digits (e.g. 00000001)</option>
                                <option value="10">10 Digits (e.g. 0000000001)</option>
                            </select>
                        </div>

                        {/* Start Number */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                                Starting Serial Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 1001"
                                min="0"
                                value={data.start_number}
                                onChange={(e) => setData('start_number', e.target.value)}
                                className={`w-full rounded-lg border py-2 px-3 text-sm font-mono bg-neutral-50 dark:bg-neutral-900/50 ${
                                    errors.start_number ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                                }`}
                                required
                            />
                            {errors.start_number && (
                                <p className="text-xs text-red-500 mt-1">{errors.start_number}</p>
                            )}
                        </div>

                        {/* End Number */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                                Ending Serial Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 1050"
                                min="0"
                                value={data.end_number}
                                onChange={(e) => setData('end_number', e.target.value)}
                                className={`w-full rounded-lg border py-2 px-3 text-sm font-mono bg-neutral-50 dark:bg-neutral-900/50 ${
                                    errors.end_number ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                                }`}
                                required
                            />
                            {errors.end_number && (
                                <p className="text-xs text-red-500 mt-1">{errors.end_number}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                                Notes / Purpose <span className="text-xs font-normal text-neutral-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Operational expense chequebook issued Sept 2026"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm bg-neutral-50 dark:bg-neutral-900/50"
                            />
                        </div>
                    </div>

                    {/* Preview Box */}
                    {previewSerials && (
                        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-brand-600" />
                                    Range Preview ({totalLeaves} leaves)
                                </span>
                                {totalLeaves > 500 && (
                                    <span className="text-xs text-red-600 font-bold">
                                        Exceeds maximum limit of 500 leaves per book!
                                    </span>
                                )}
                            </div>
                            <p className="font-mono text-base font-bold text-brand-900 dark:text-brand-200">
                                {previewSerials.first} &nbsp;➔&nbsp; {previewSerials.last}
                            </p>
                            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                                Every cheque leaf in this range will be generated and tracked individually.
                            </p>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <Link
                            href={route('store.banking.cheque-books.index')}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || totalLeaves <= 0 || totalLeaves > 500}
                            className="px-6 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                        >
                            {processing ? 'Registering...' : `Register Chequebook (${totalLeaves} Leaves)`}
                        </button>
                    </div>
                </form>
            </div>
        </OneGlanceLayout>
    );
}
