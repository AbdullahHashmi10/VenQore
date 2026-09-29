import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import PremiumSelect from '@/Components/PremiumSelect';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import {
    FileText, ArrowLeft, Download, Search, Building2
} from 'lucide-react';

export default function IncomingRegister({ cheques, bankAccounts = [], parties = [], filters = {} }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedBank, setSelectedBank] = useState(filters.deposit_bank_account_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedParty, setSelectedParty] = useState(filters.party_id || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.reports.incoming-cheques', { store_slug: storeSlug }), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            deposit_bank_account_id: newFilters.deposit_bank_account_id !== undefined ? newFilters.deposit_bank_account_id : selectedBank,
            status: newFilters.status !== undefined ? newFilters.status : selectedStatus,
            party_id: newFilters.party_id !== undefined ? newFilters.party_id : selectedParty,
            from_date: newFilters.from_date !== undefined ? newFilters.from_date : fromDate,
            to_date: newFilters.to_date !== undefined ? newFilters.to_date : toDate,
        }, { preserveState: true, replace: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            export: 'csv',
            search,
            deposit_bank_account_id: selectedBank,
            status: selectedStatus,
            party_id: selectedParty,
            from_date: fromDate,
            to_date: toDate,
        });
        window.location.href = `${route('store.banking.reports.incoming-cheques', { store_slug: storeSlug })}?${params.toString()}`;
    };

    return (
        <OneGlanceLayout title="Incoming Cheque Register" activeMenu="Money">
            <Head title="Incoming Cheque Register" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                {/* Line 1: Module Navigation Tabs */}
                <MoneyModuleTabs activeTab="received-cheques" className="!mb-0" />

                {/* Line 2: Reports Sub-nav pills */}
                <div className="bg-surface px-3 py-1.5 rounded-xl border border-line shadow-sm flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted shrink-0">Reports:</span>
                    <Link
                        href={route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Outgoing Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.incoming-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0"
                    >
                        Incoming Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.cheque-utilization', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Chequebook Utilization
                    </Link>
                    <Link
                        href={route('store.banking.reports.post-dated-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Post-Dated Cheques
                    </Link>
                </div>

                {/* Line 3: Compact Header & Filter Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('store.banking.received-cheques.index', { store_slug: storeSlug })}
                            className="p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <h1 className="text-base font-bold text-ink uppercase tracking-tight">
                            Incoming <span className="text-brand-600">Register</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-40 sm:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                type="text"
                                placeholder="Search cheque #, bank..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilterChange({ search: e.target.value });
                                }}
                                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-app border-none rounded-lg focus:ring-1 focus:ring-brand-500 text-ink-secondary dark:text-ink"
                            />
                        </div>

                    <div>
                        <PremiumSelect
                            value={selectedStatus}
                            onChange={(val) => {
                                setSelectedStatus(val);
                                handleFilterChange({ status: val });
                            }}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'received', label: 'In Hand' },
                                { value: 'deposited', label: 'Deposited' },
                                { value: 'cleared', label: 'Cleared' },
                                { value: 'bounced', label: 'Bounced' },
                                { value: 'returned', label: 'Returned' }
                            ]}
                            placeholder="All Statuses"
                            inputClassName="!rounded-full !py-2 !px-4 !bg-neutral-50 dark:!bg-neutral-900/50 !border-neutral-200 dark:!border-neutral-700 text-xs sm:text-sm font-medium"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <PremiumSelect
                            value={selectedParty}
                            onChange={(val) => {
                                setSelectedParty(val);
                                handleFilterChange({ party_id: val });
                            }}
                            options={[
                                { value: '', label: 'All Customers' },
                                ...parties.map((p) => ({
                                    value: String(p.id),
                                    label: p.name
                                }))
                            ]}
                            placeholder="All Customers"
                            inputClassName="!rounded-full !py-2 !px-4 !bg-neutral-50 dark:!bg-neutral-900/50 !border-neutral-200 dark:!border-neutral-700 text-xs sm:text-sm font-medium"
                            className="w-full"
                        />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-1">
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

                {/* Line 4: Full Width Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3.5">Cheque Number</th>
                                    <th className="px-6 py-3.5">Drawer Bank</th>
                                    <th className="px-6 py-3.5">Customer</th>
                                    <th className="px-6 py-3.5">Cheque Date</th>
                                    <th className="px-6 py-3.5">Amount</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Deposit Bank / Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {cheques.data && cheques.data.length > 0 ? (
                                    cheques.data.map((c) => (
                                        <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                #{c.cheque_number}
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {c.bank_name} {c.branch ? `(${c.branch})` : ''}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {c.party?.name || 'Walk-in Customer'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                {c.cheque_date}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {formatCurrency(c.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                                    c.status === 'cleared' ? 'bg-purple-100 text-purple-800' :
                                                    c.status === 'deposited' ? 'bg-blue-100 text-blue-800' :
                                                    c.status === 'received' ? 'bg-amber-100 text-amber-800' :
                                                    c.status === 'bounced' ? 'bg-red-100 text-red-800' :
                                                    'bg-neutral-100 text-neutral-800'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {c.deposit_bank_account?.name ? `${c.deposit_bank_account.name} • ${c.deposit_date}` : 'In Hand'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-neutral-400">
                                            No incoming cheques found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </div>
        </OneGlanceLayout>
    );
}
