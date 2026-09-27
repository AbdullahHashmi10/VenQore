import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    BookOpen, Plus, Search, Building2, CheckCircle2, AlertTriangle,
    XCircle, Clock, ChevronRight, Ban, FileText, ArrowRight
} from 'lucide-react';

export default function ChequeBooksIndex({ chequeBooks, bankAccounts, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedBank, setSelectedBank] = useState(filters.bank_account_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.cheque-books.index'), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            bank_account_id: newFilters.bank_account_id !== undefined ? newFilters.bank_account_id : selectedBank,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
        }, { preserveState: true, replace: true });
    };

    const handleCloseBook = (id) => {
        if (confirm('Are you sure you want to close this chequebook? No more leaves can be issued from a closed book.')) {
            router.post(route('store.banking.cheque-books.close', id));
        }
    };

    const handleDeleteBook = (id) => {
        if (confirm('Are you sure you want to delete this chequebook? All unused leaves will be deleted.')) {
            router.delete(route('store.banking.cheque-books.destroy', id));
        }
    };

    return (
        <OneGlanceLayout>
            <Head title="Chequebooks Management" />

            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                            <BookOpen className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                            Chequebooks & Cheque Management
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Track bank chequebooks, monitor individual leaf status, and maintain complete audit trails.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.banking.reports.outgoing-cheques')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 shadow-sm transition-colors"
                        >
                            <FileText className="w-4 h-4 text-neutral-500" />
                            Cheque Registers
                        </Link>
                        <Link
                            href={route('store.banking.cheque-books.create')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Register Chequebook
                        </Link>
                    </div>
                </div>

                {/* Subnavigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" />

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-800/80 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search series prefix, bank account, notes..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange({ search: e.target.value });
                            }}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedBank}
                            onChange={(e) => {
                                setSelectedBank(e.target.value);
                                handleFilterChange({ bank_account_id: e.target.value });
                            }}
                            className="py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm text-neutral-900 dark:text-neutral-100"
                        >
                            <option value="">All Bank Accounts</option>
                            {bankAccounts.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} ({b.bank_name})
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                            className="py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm text-neutral-900 dark:text-neutral-100"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="exhausted">Exhausted</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3.5">Bank Account</th>
                                    <th className="px-6 py-3.5">Cheque Range</th>
                                    <th className="px-6 py-3.5">Leaf Status</th>
                                    <th className="px-6 py-3.5">Utilization</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {chequeBooks.data && chequeBooks.data.length > 0 ? (
                                    chequeBooks.data.map((book) => {
                                        const total = book.total_leaves_count || book.total_leaves || 0;
                                        const avail = book.available_leaves_count || 0;
                                        const issued = book.issued_leaves_count || 0;
                                        const cleared = book.cleared_leaves_count || 0;
                                        const used = total - avail;
                                        const pct = total > 0 ? Math.round((used / total) * 100) : 0;

                                        return (
                                            <tr key={book.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                                                            <Building2 className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                {book.bank_account?.name || 'Bank Account'}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                {book.bank_account?.bank_name} {book.bank_account?.account_number ? `• ${book.bank_account.account_number}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                        {book.series_prefix ? `${book.series_prefix}-` : ''}
                                                        {String(book.start_number).padStart(book.padding_zeros || 6, '0')} ... {String(book.end_number).padStart(book.padding_zeros || 6, '0')}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {total} total leaves
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> {avail} Avail
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                                            <Clock className="w-3.5 h-3.5" /> {issued} Issued
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                                            {cleared} Cleared
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="w-36">
                                                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                                            <span>{used} used</span>
                                                            <span>{pct}%</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    pct === 100 ? 'bg-amber-500' : 'bg-brand-600'
                                                                }`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                        book.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : book.status === 'exhausted'
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
                                                    }`}>
                                                        {book.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('store.banking.cheque-books.show', book.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-lg transition-colors"
                                                        >
                                                            View Leaves
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Link>

                                                        {book.status === 'active' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCloseBook(book.id)}
                                                                className="px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                                                                title="Close Chequebook"
                                                            >
                                                                Close
                                                            </button>
                                                        )}

                                                        {used === 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBook(book.id)}
                                                                className="px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                                title="Delete Unused Chequebook"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-neutral-400">
                                            <BookOpen className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                                            <p className="font-semibold text-neutral-700 dark:text-neutral-300">No chequebooks found</p>
                                            <p className="text-xs text-neutral-500 mt-1">Get started by registering a new bank chequebook.</p>
                                            <Link
                                                href={route('store.banking.cheque-books.create')}
                                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Register First Chequebook
                                            </Link>
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
