import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
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

    const navGroups = useMoneyNavGroups();

    return (
        <OneGlanceLayout title="Chequebooks Management" activeMenu="Money" noPadding>
            <Head title="Chequebooks Management" />

            <div className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden md:contents">
              <ListPageFrame className="max-md:contents">
                {/* ── Desktop header: two rows ── */}
                <ListToolbar
                    title="Chequebooks"
                    navGroups={navGroups}
                    activeId="cheque-books"
                    left={(
                        <div className="flex items-center gap-2">
                            <PremiumSelect
                                value={selectedBank}
                                onChange={(val) => {
                                    setSelectedBank(val);
                                    handleFilterChange({ bank_account_id: val });
                                }}
                                options={[
                                    { value: '', label: 'All Bank Accounts' },
                                    ...bankAccounts.map((b) => ({ value: String(b.id), label: `${b.name} (${b.bank_name})` }))
                                ]}
                                placeholder="All Bank Accounts"
                                inputClassName="!h-10 !py-0 !px-3 !rounded-[12px] !bg-app !border !border-line text-sm font-semibold"
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
                                inputClassName="!h-10 !py-0 !px-3 !rounded-[12px] !bg-app !border !border-line text-sm font-semibold"
                                className="w-auto"
                            />
                        </div>
                    )}
                    search={{
                        value: search,
                        onChange: (v) => { setSearch(v); handleFilterChange({ search: v }); },
                        placeholder: 'Search series, bank…',
                    }}
                    actions={(
                        <>
                            <Link
                                href={route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug })}
                                className="h-10 px-3 rounded-[12px] border border-line bg-app hover:bg-interactive-hover text-ink text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <FileText size={15} className="text-ink-muted" /> Registers
                            </Link>
                            <ListAddButton href={route('store.banking.cheque-books.create', { store_slug: storeSlug })} icon={Plus}>Register Chequebook</ListAddButton>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Total Books', value: totalBooks, icon: BookOpen },
                    { label: 'Active Books', value: activeBooks, icon: CheckCircle2, icon_tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Available Leaves', value: availableLeaves, icon: FileText, icon_tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value_tone: 'text-blue-600' },
                    { label: 'Issued Leaves', value: issuedLeaves, icon: Clock, icon_tone: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', value_tone: 'text-purple-600' },
                ]} />

                {/* Phone / existing header (hidden on md+) */}
                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Chequebooks"
                    navGroups={navGroups}
                    activeId="cheque-books"
                    links={[{ label: 'Registers', icon: FileText, href: route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug }) }]}
                    filter={{
                        active: !!(selectedBank || selectedStatus),
                        sections: [
                            { label: 'Bank Account', value: selectedBank, options: [{ value: '', label: 'All Bank Accounts' }, ...bankAccounts.map((b) => ({ value: String(b.id), label: `${b.name} (${b.bank_name})` }))], onSelect: (val) => { setSelectedBank(val); handleFilterChange({ bank_account_id: val }); } },
                            { label: 'Status', value: selectedStatus, options: [{ value: '', label: 'All Statuses' }, { value: 'active', label: 'Active' }, { value: 'exhausted', label: 'Exhausted' }, { value: 'closed', label: 'Closed' }], onSelect: (val) => { setSelectedStatus(val); handleFilterChange({ status: val }); } },
                        ],
                    }}
                    search={{ value: search, onChange: (v) => { setSearch(v); handleFilterChange({ search: v }); }, placeholder: 'Search series, bank…' }}
                    add={{ href: route('store.banking.cheque-books.create', { store_slug: storeSlug }), label: 'Register Chequebook' }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Books', value: totalBooks, tone: 'brand', icon: BookOpen },
                    { label: 'Active Books', value: activeBooks, tone: 'emerald', icon: CheckCircle2 },
                    { label: 'Available Leaves', value: availableLeaves, tone: 'blue', icon: FileText },
                    { label: 'Issued Leaves', value: issuedLeaves, tone: 'purple', icon: Clock },
                ]} />

                {/* Line 4: Edge-to-Edge Full-Width Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Bank Account</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Cheque Range</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Leaf Status</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Utilization</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Status</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Actions</th>
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
              </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
