import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { getCurrencySymbol } from '@/Utils/format';
import {
    FileText, ArrowLeft, Download, Search, Building2,
    Calendar, Filter
} from 'lucide-react';

const formatCurrency = (val) =>
    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));

export default function OutgoingRegister({ leaves, bankAccounts = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedBank, setSelectedBank] = useState(filters.bank_account_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.reports.outgoing-cheques'), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            bank_account_id: newFilters.bank_account_id !== undefined ? newFilters.bank_account_id : selectedBank,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            from_date: newFilters.from_date !== undefined ? newFilters.from_date : fromDate,
            to_date: newFilters.to_date !== undefined ? newFilters.to_date : toDate,
        }, { preserveState: true, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            export: 'csv',
            search,
            bank_account_id: selectedBank,
            status: selectedStatus,
            from_date: fromDate,
            to_date: toDate,
        });
        window.location.href = `${route('store.banking.reports.outgoing-cheques')}?${params.toString()}`;
    };

    return (
        <OneGlanceLayout>
            <Head title="Outgoing Cheque Register" />

            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.banking.cheque-books.index')}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-600 dark:text-neutral-300"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-brand-600" />
                                Outgoing Cheque Register
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Detailed chronological log of all cheques issued from your company bank accounts.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 shadow-sm transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Subnavigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" />

                {/* Secondary navigation for Cheque reports */}
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-2">Reports:</span>
                    <Link
                        href={route('store.banking.reports.outgoing-cheques')}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    >
                        Outgoing Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.incoming-cheques')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Incoming Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.cheque-utilization')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Chequebook Utilization
                    </Link>
                    <Link
                        href={route('store.banking.reports.post-dated-cheques')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Post-Dated Cheques
                    </Link>
                </div>

                {/* Filter Controls */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative sm:col-span-2">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search cheque #, payee..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange({ search: e.target.value });
                            }}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
                        />
                    </div>

                    <div>
                        <select
                            value={selectedBank}
                            onChange={(e) => {
                                setSelectedBank(e.target.value);
                                handleFilterChange({ bank_account_id: e.target.value });
                            }}
                            className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
                        >
                            <option value="">All Bank Accounts</option>
                            {bankAccounts.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                            className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="issued">Issued</option>
                            <option value="cleared">Cleared</option>
                            <option value="bounced">Bounced</option>
                            <option value="stopped">Stopped</option>
                            <option value="reserved">Reserved</option>
                            <option value="void">Void</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                handleFilterChange({ from_date: e.target.value });
                            }}
                            className="w-full py-1.5 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs"
                            placeholder="From"
                        />
                        <span className="text-neutral-400">-</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                handleFilterChange({ to_date: e.target.value });
                            }}
                            className="w-full py-1.5 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs"
                            placeholder="To"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3.5">Cheque Number</th>
                                    <th className="px-6 py-3.5">Bank Account</th>
                                    <th className="px-6 py-3.5">Payee / Party</th>
                                    <th className="px-6 py-3.5">Cheque Date</th>
                                    <th className="px-6 py-3.5">Amount</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Clear / Bounce Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {leaves.data && leaves.data.length > 0 ? (
                                    leaves.data.map((leaf) => (
                                        <tr key={leaf.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {leaf.display_serial_number}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                                {leaf.bank_account?.name}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {leaf.party?.name || leaf.payment?.party?.name || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                {leaf.cheque_date || '—'}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {leaf.amount ? formatCurrency(leaf.amount) : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                    leaf.status === 'cleared' ? 'bg-purple-100 text-purple-800' :
                                                    leaf.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                                                    leaf.status === 'bounced' ? 'bg-red-100 text-red-800' :
                                                    leaf.status === 'stopped' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-neutral-100 text-neutral-800'
                                                }`}>
                                                    {leaf.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {leaf.clear_date || leaf.status_reason || '—'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-neutral-400">
                                            No outgoing cheques found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
