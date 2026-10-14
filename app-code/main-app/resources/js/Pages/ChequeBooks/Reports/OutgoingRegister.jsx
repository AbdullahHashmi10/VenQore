import React, { useState } from 'react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { useChequeReportNavGroups, ToolbarDate } from '@/Components/ChequeReportNav';
import PremiumSelect from '@/Components/PremiumSelect';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import {
    FileText, ArrowLeft, Download, Search, Building2,
    Calendar, Filter
} from 'lucide-react';

export default function OutgoingRegister({ leaves, bankAccounts = [], filters = {} }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const navGroups = useChequeReportNavGroups();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedBank, setSelectedBank] = useState(filters.bank_account_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug }), {
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
        window.location.href = `${route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug })}?${params.toString()}`;
    };

    return (
        <OneGlanceLayout title="Outgoing Cheque Register" activeMenu="Money" noPadding>
            <Head title="Outgoing Cheque Register" />

            <div className="max-md:p-1.5 max-md:h-full md:contents">
            <ListPageFrame className="max-md:flex max-md:flex-col max-md:h-full max-md:bg-app max-md:p-2 max-md:gap-1 max-md:overflow-hidden">
                <ListToolbar
                    title="Outgoing Cheque Register"
                    navGroups={navGroups}
                    activeId="outgoing"
                    left={<>
                        <ListFilterPill label="All Bank Accounts" value={String(selectedBank)} allValue="" onChange={(val) => { setSelectedBank(val); handleFilterChange({ bank_account_id: val }); }} options={[
                            { value: '', label: 'All Bank Accounts' }, ...bankAccounts.map((b) => ({ value: String(b.id), label: b.name })),
                        ]} />
                        <ListFilterPill label="All Statuses" value={selectedStatus} allValue="" onChange={(val) => { setSelectedStatus(val); handleFilterChange({ status: val }); }} options={[
                            { value: '', label: 'All Statuses' }, { value: 'issued', label: 'Issued' }, { value: 'cleared', label: 'Cleared' }, { value: 'bounced', label: 'Bounced' }, { value: 'stopped', label: 'Stopped' }, { value: 'reserved', label: 'Reserved' }, { value: 'void', label: 'Void' },
                        ]} />
                        <ToolbarDate title="From" value={fromDate} onChange={(v) => { setFromDate(v); handleFilterChange({ from_date: v }); }} />
                        <ToolbarDate title="To" value={toDate} onChange={(v) => { setToDate(v); handleFilterChange({ to_date: v }); }} />
                    </>}
                    search={{ value: search, onChange: (v) => { setSearch(v); handleFilterChange({ search: v }); }, placeholder: 'Search cheque #, payee...' }}
                    actions={<button type="button" onClick={handleExport} className="h-10 px-4 rounded-[12px] border border-line bg-app text-ink text-sm font-bold flex items-center gap-2 hover:bg-interactive-hover transition-colors whitespace-nowrap"><Download size={16} />Export</button>}
                />
                <ListStatCards cards={[{ label: 'Cheque leaves', value: leaves.total ?? (leaves.data || []).length, icon: FileText }]} />

                <MobileListHeader
                    title="Outgoing Cheques"
                    navGroups={navGroups}
                    activeId="outgoing"
                    filter={{
                        active: !!(selectedBank || selectedStatus || fromDate || toDate),
                        sections: [
                            { label: 'Status', value: selectedStatus, options: [{ value: '', label: 'All Statuses' }, { value: 'issued', label: 'Issued' }, { value: 'cleared', label: 'Cleared' }, { value: 'bounced', label: 'Bounced' }, { value: 'stopped', label: 'Stopped' }, { value: 'reserved', label: 'Reserved' }, { value: 'void', label: 'Void' }], onSelect: (val) => { setSelectedStatus(val); handleFilterChange({ status: val }); } },
                            { label: 'Bank', value: String(selectedBank), options: [{ value: '', label: 'All Bank Accounts' }, ...bankAccounts.map((b) => ({ value: String(b.id), label: b.name }))], onSelect: (val) => { setSelectedBank(val); handleFilterChange({ bank_account_id: val }); } },
                        ],
                        footer: (
                            <div className="flex items-center gap-1.5 px-1 pt-2 mt-1 border-t border-line">
                                <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); handleFilterChange({ from_date: e.target.value }); }} className="h-9 min-w-0 flex-1 px-2 rounded-[10px] border border-line bg-app text-xs text-ink" />
                                <span className="text-ink-muted">-</span>
                                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); handleFilterChange({ to_date: e.target.value }); }} className="h-9 min-w-0 flex-1 px-2 rounded-[10px] border border-line bg-app text-xs text-ink" />
                            </div>
                        ),
                    }}
                    search={{ value: search, onChange: (v) => { setSearch(v); handleFilterChange({ search: v }); }, placeholder: 'Search cheque #, payee...' }}
                    actions={[{ icon: Download, label: 'Export', onClick: handleExport }]}
                />
                <MobileStats bp="md" hero={0} items={[{ label: 'Cheque leaves', value: leaves.total ?? (leaves.data || []).length, tone: 'brand', icon: FileText }]} />

                {/* Line 4: Full Width Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <div className="overflow-x-auto md:overflow-visible">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 md:sticky md:top-0 md:z-10">
                                <tr>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Cheque Number</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Bank Account</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Payee / Party</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Cheque Date</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Amount</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Status</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Clear / Bounce Date</th>
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
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
