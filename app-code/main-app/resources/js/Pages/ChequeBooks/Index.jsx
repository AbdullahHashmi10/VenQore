import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import PremiumSelect from '@/Components/PremiumSelect';
import {
    BookOpen, Plus, Search, Building2, CheckCircle2, AlertTriangle,
    XCircle, Clock, ChevronRight, Ban, FileText, ArrowRight
} from 'lucide-react';

export default function ChequeBooksIndex({ chequeBooks, bankAccounts, filters = {} }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedBank, setSelectedBank] = useState(filters.bank_account_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.cheque-books.index', { store_slug: storeSlug }), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            bank_account_id: newFilters.bank_account_id !== undefined ? newFilters.bank_account_id : selectedBank,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
        }, { preserveState: true, replace: true });
    };

    const handleCloseBook = (id) => {
        if (confirm('Are you sure you want to close this chequebook? No more leaves can be issued from a closed book.')) {
            router.post(route('store.banking.cheque-books.close', { store_slug: storeSlug, id }));
        }
    };

    const handleDeleteBook = (id) => {
        if (confirm('Are you sure you want to delete this chequebook? All unused leaves will be deleted.')) {
            router.delete(route('store.banking.cheque-books.destroy', { store_slug: storeSlug, id }));
        }
    };

    // Calculate Summary KPI Statistics
    const booksList = chequeBooks.data || [];
    const totalBooks = chequeBooks.total || booksList.length || 0;
    const activeBooks = booksList.filter(b => b.status === 'active').length;
    const availableLeaves = booksList.reduce((acc, b) => acc + (b.available_leaves_count || 0), 0);
    const issuedLeaves = booksList.reduce((acc, b) => acc + (b.issued_leaves_count || 0), 0);

    return (
        <OneGlanceLayout title="Chequebooks Management" activeMenu="Money">
            <Head title="Chequebooks Management" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                {/* Line 1: Module Navigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" className="!mb-0" />

                {/* Line 2: 4 Compact KPI Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <BookOpen size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Books</p>
                        </div>
                        <p className="text-base font-bold text-ink">{totalBooks}</p>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle2 size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Active Books</p>
                        </div>
                        <p className="text-base font-bold text-emerald-600">{activeBooks}</p>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <FileText size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Available Leaves</p>
                        </div>
                        <p className="text-base font-bold text-blue-600">{availableLeaves}</p>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Issued Leaves</p>
                        </div>
                        <p className="text-base font-bold text-purple-600">{issuedLeaves}</p>
                    </div>
                </div>

                {/* Line 3: Compact Single-Row Header & Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Cheque<span className="text-brand-600">books</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        <span className="text-xs font-bold text-ink-muted">{totalBooks} Books</span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-48 sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                placeholder="Search series, bank..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilterChange({ search: e.target.value });
                                }}
                                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-app border-none rounded-lg focus:ring-1 focus:ring-brand-500 text-ink-secondary dark:text-ink"
                            />
                        </div>

                        <PremiumSelect
                            value={selectedBank}
                            onChange={(val) => {
                                setSelectedBank(val);
                                handleFilterChange({ bank_account_id: val });
                            }}
                            options={[
                                { value: '', label: 'All Bank Accounts' },
                                ...bankAccounts.map((b) => ({
                                    value: String(b.id),
                                    label: `${b.name} (${b.bank_name})`
                                }))
                            ]}
                            placeholder="All Bank Accounts"
                            inputClassName="!py-1.5 !px-3 !bg-app !border-none text-xs font-bold"
                            className="w-auto"
                        />

                        <PremiumSelect
                            value={selectedStatus}
                            onChange={(val) => {
                                setSelectedStatus(val);
                                handleFilterChange({ status: val });
                            }}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'exhausted', label: 'Exhausted' },
                                { value: 'closed', label: 'Closed' }
                            ]}
                            placeholder="All Statuses"
                            inputClassName="!py-1.5 !px-3 !bg-app !border-none text-xs font-bold"
                            className="w-auto"
                        />

                        <Link
                            href={route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug })}
                            className="px-3 py-1.5 bg-app hover:bg-interactive-hover text-ink rounded-lg text-xs font-bold flex items-center gap-1.5 border border-line shadow-xs transition-colors"
                        >
                            <FileText size={14} className="text-ink-muted" />
                            <span>Registers</span>
                        </Link>

                        <Link
                            href={route('store.banking.cheque-books.create', { store_slug: storeSlug })}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 !text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            style={{ color: '#ffffff' }}
                        >
                            <Plus size={14} className="text-white shrink-0" />
                            <span className="text-white">Register Chequebook</span>
                        </Link>
                    </div>
                </div>

                {/* Line 4: Edge-to-Edge Full-Width Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Bank Account</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Cheque Range</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Leaf Status</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Utilization</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {chequeBooks.data && chequeBooks.data.length > 0 ? (
                                chequeBooks.data.map((book) => {
                                    const total = book.total_leaves_count || book.total_leaves || 0;
                                    const avail = book.available_leaves_count || 0;
                                    const issued = book.issued_leaves_count || 0;
                                    const cleared = book.cleared_leaves_count || 0;
                                    const used = total - avail;
                                    const pct = total > 0 ? Math.round((used / total) * 100) : 0;

                                    return (
                                        <tr key={book.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 shrink-0">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-ink text-sm">
                                                            {book.bank_account?.name || 'Bank Account'}
                                                        </p>
                                                        <p className="text-xs text-ink-muted">
                                                            {book.bank_account?.bank_name} {book.bank_account?.account_number ? `#${book.bank_account.account_number}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-mono text-xs font-bold text-ink">
                                                    {book.first_leaf_number} — {book.last_leaf_number}
                                                </p>
                                                {book.series_prefix && (
                                                    <p className="text-2xs text-ink-muted">Prefix: {book.series_prefix}</p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                        {avail} Avail
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                                                        {issued} Issued
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                                        {cleared} Cleared
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="w-36">
                                                    <div className="flex justify-between text-2xs font-bold text-ink mb-1">
                                                        <span>{used} / {total} Leaves</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-sunken h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-amber-500' : 'bg-brand-600'}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider ${
                                                    book.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                        : book.status === 'exhausted'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}>
                                                    {book.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('store.banking.cheque-books.show', { store_slug: storeSlug, id: book.id })}
                                                        className="px-3 py-1 bg-app hover:bg-interactive-hover text-ink text-xs font-bold rounded-lg border border-line transition-colors"
                                                    >
                                                        View Leaves
                                                    </Link>

                                                    {book.status === 'active' && (
                                                        <button
                                                            onClick={() => handleCloseBook(book.id)}
                                                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 rounded-lg transition-colors"
                                                            title="Close Book"
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    )}

                                                    {used === 0 && (
                                                        <button
                                                            onClick={() => handleDeleteBook(book.id)}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 rounded-lg transition-colors"
                                                            title="Delete Chequebook"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-5 sm:p-12 text-center text-ink-muted">
                                        <div className="flex flex-col items-center justify-center">
                                            <BookOpen size={40} className="mb-2 opacity-40 text-ink-muted" />
                                            <p className="text-sm font-bold text-ink">No chequebooks found</p>
                                            <p className="text-xs text-ink-muted mt-1">Get started by registering a new bank chequebook.</p>
                                            <Link
                                                href={route('store.banking.cheque-books.create', { store_slug: storeSlug })}
                                                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 !text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                                                style={{ color: '#ffffff' }}
                                            >
                                                <Plus size={14} className="text-white shrink-0" />
                                                <span className="text-white">Register First Chequebook</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
