import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import PremiumSelect from '@/Components/PremiumSelect';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import {
    FileText, Plus, Search, Building2, CheckCircle2,
    Clock, AlertTriangle, XCircle, ArrowUpRight, RotateCcw,
    X, AlertCircle
} from 'lucide-react';

export default function ReceivedChequesIndex({
    receivedCheques,
    bankAccounts = [],
    parties = [],
    stats = {},
    filters = {}
}) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [partyFilter, setPartyFilter] = useState(filters.party_id || '');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [depositModal, setDepositModal] = useState(null); // receivedCheque
    const [actionModal, setActionModal] = useState(null); // { type: 'clear'|'bounce'|'return', cheque }

    const [actionReason, setActionReason] = useState('');
    const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
    const [depositBankId, setDepositBankId] = useState(bankAccounts.length === 1 ? bankAccounts[0].id : '');
    const [submitting, setSubmitting] = useState(false);

    const { data: createData, setData: setCreateData, post: postCreate, processing: createProcessing, reset: resetCreate, errors: createErrors } = useForm({
        cheque_number: '',
        amount: '',
        party_id: '',
        bank_name: '',
        branch: '',
        cheque_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.received-cheques.index', { store_slug: storeSlug }), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : statusFilter,
            party_id: newFilters.party_id !== undefined ? newFilters.party_id : partyFilter,
        }, { preserveState: true, replace: true });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        postCreate(route('store.banking.received-cheques.store', { store_slug: storeSlug }), {
            onSuccess: () => {
                setIsCreateOpen(false);
                resetCreate();
            },
        });
    };

    const handleDepositSubmit = (e) => {
        e.preventDefault();
        if (!depositModal || !depositBankId) return;

        setSubmitting(true);
        router.post(route('store.banking.received-cheques.deposit', { store_slug: storeSlug, id: depositModal.id }), {
            bank_account_id: depositBankId,
            deposit_date: actionDate,
        }, {
            onSuccess: () => setDepositModal(null),
            onFinish: () => setSubmitting(false),
        });
    };

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (!actionModal) return;

        setSubmitting(true);
        const { type, cheque } = actionModal;

        let url = '';
        let payload = {};

        if (type === 'clear') {
            url = route('store.banking.received-cheques.clear', { store_slug: storeSlug, id: cheque.id });
            payload = { clear_date: actionDate };
        } else if (type === 'bounce') {
            url = route('store.banking.received-cheques.bounce', { store_slug: storeSlug, id: cheque.id });
            payload = { reason: actionReason, bounce_date: actionDate };
        } else if (type === 'return') {
            url = route('store.banking.received-cheques.return', { store_slug: storeSlug, id: cheque.id });
            payload = { reason: actionReason };
        }

        router.post(url, payload, {
            onSuccess: () => {
                setActionModal(null);
                setActionReason('');
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'received':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
            case 'deposited':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
            case 'cleared':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
            case 'bounced':
                return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
            case 'returned':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300';
            default:
                return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
        }
    };

    const navGroups = useMoneyNavGroups();
    const selectCls = '!h-10 !py-0 !px-3 !rounded-[12px] !bg-app !border !border-line text-sm font-semibold';

    return (
        <OneGlanceLayout title="Received Customer Cheques" activeMenu="Money" noPadding>
            <Head title="Received Customer Cheques" />

            <div className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden md:contents">
              <ListPageFrame className="max-md:contents">
                {/* ── Desktop header: two rows ── */}
                <ListToolbar
                    title="Received Cheques"
                    navGroups={navGroups}
                    activeId="received-cheques"
                    left={(
                        <div className="flex items-center gap-2">
                            <PremiumSelect
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); handleFilterChange({ status: val }); }}
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    { value: 'received', label: 'In Hand (Received)' },
                                    { value: 'deposited', label: 'Deposited' },
                                    { value: 'cleared', label: 'Cleared' },
                                    { value: 'bounced', label: 'Bounced' },
                                    { value: 'returned', label: 'Returned' }
                                ]}
                                placeholder="All Statuses"
                                inputClassName={selectCls}
                                className="w-auto"
                            />
                            <PremiumSelect
                                value={partyFilter}
                                onChange={(val) => { setPartyFilter(val); handleFilterChange({ party_id: val }); }}
                                options={[
                                    { value: '', label: 'All Customers' },
                                    ...parties.map((p) => ({ value: String(p.id), label: p.name }))
                                ]}
                                placeholder="All Customers"
                                inputClassName={selectCls}
                                className="w-auto"
                            />
                        </div>
                    )}
                    search={{
                        value: search,
                        onChange: (v) => { setSearch(v); handleFilterChange({ search: v }); },
                        placeholder: 'Search cheque #, bank…',
                    }}
                    actions={(
                        <>
                            <Link
                                href={route('store.banking.reports.incoming-cheques', { store_slug: storeSlug })}
                                className="h-10 px-3 rounded-[12px] border border-line bg-app hover:bg-interactive-hover text-ink text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <FileText size={15} className="text-ink-muted" /> Incoming Register
                            </Link>
                            <ListAddButton onClick={() => setIsCreateOpen(true)} icon={Plus}>Record Cheque</ListAddButton>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'In Hand', value: formatCurrency(stats.total_received || 0), icon: Clock, icon_tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', value_tone: 'text-amber-600' },
                    { label: 'Deposited', value: formatCurrency(stats.total_deposited || 0), icon: Building2, icon_tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value_tone: 'text-blue-600' },
                    { label: 'Cleared', value: formatCurrency(stats.total_cleared || 0), icon: CheckCircle2, icon_tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Bounced', value: formatCurrency(stats.total_bounced || 0), icon: AlertTriangle, icon_tone: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', value_tone: 'text-rose-600' },
                ]} />

                {/* Phone / existing header (hidden on md+) */}
                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Received Cheques"
                    navGroups={navGroups}
                    activeId="received-cheques"
                    links={[{ label: 'Incoming Register', icon: FileText, href: route('store.banking.reports.incoming-cheques', { store_slug: storeSlug }) }]}
                    filter={{
                        active: !!(statusFilter || partyFilter),
                        sections: [
                            { label: 'Status', value: statusFilter, options: [{ value: '', label: 'All Statuses' }, { value: 'received', label: 'In Hand (Received)' }, { value: 'deposited', label: 'Deposited' }, { value: 'cleared', label: 'Cleared' }, { value: 'bounced', label: 'Bounced' }, { value: 'returned', label: 'Returned' }], onSelect: (val) => { setStatusFilter(val); handleFilterChange({ status: val }); } },
                            { label: 'Customer', value: partyFilter, options: [{ value: '', label: 'All Customers' }, ...parties.map((p) => ({ value: String(p.id), label: p.name }))], onSelect: (val) => { setPartyFilter(val); handleFilterChange({ party_id: val }); } },
                        ],
                    }}
                    search={{ value: search, onChange: (v) => { setSearch(v); handleFilterChange({ search: v }); }, placeholder: 'Search cheque #, bank…' }}
                    add={{ onClick: () => setIsCreateOpen(true), label: 'Record Cheque' }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'In Hand', value: formatCurrency(stats.total_received || 0), tone: 'amber', icon: Clock },
                    { label: 'Deposited', value: formatCurrency(stats.total_deposited || 0), tone: 'blue', icon: Building2 },
                    { label: 'Cleared', value: formatCurrency(stats.total_cleared || 0), tone: 'emerald', icon: CheckCircle2 },
                    { label: 'Bounced', value: formatCurrency(stats.total_bounced || 0), tone: 'rose', icon: AlertTriangle },
                ]} />

                {/* Line 4: Edge-to-Edge Full-Width Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <div className="overflow-x-auto md:overflow-visible">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="md:sticky md:top-0 md:z-10 bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Cheque Details</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Customer</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Amount</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Status</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Deposit Account</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Dates</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {receivedCheques.data && receivedCheques.data.length > 0 ? (
                                    receivedCheques.data.map((cheque) => (
                                        <tr key={cheque.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                    #{cheque.cheque_number}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {cheque.bank_name} {cheque.branch ? `(${cheque.branch})` : ''}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {cheque.party?.name || 'Walk-in Customer'}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {formatCurrency(cheque.amount)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadge(cheque.status)}`}>
                                                    {cheque.status === 'received' ? 'In Hand' : cheque.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-xs">
                                                {cheque.deposit_bank_account?.name || (
                                                    <span className="text-neutral-400 italic">Not deposited yet</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-xs space-y-0.5 text-neutral-500">
                                                <p>Cheque: <span className="font-mono text-neutral-700 dark:text-neutral-300">{cheque.cheque_date}</span></p>
                                                {cheque.deposit_date && <p>Deposit: {cheque.deposit_date}</p>}
                                                {cheque.clear_date && <p>Clear: {cheque.clear_date}</p>}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {cheque.status === 'received' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDepositModal(cheque)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition-colors"
                                                        >
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                            Deposit
                                                        </button>
                                                    )}

                                                    {cheque.status === 'deposited' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActionModal({ type: 'clear', cheque })}
                                                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActionModal({ type: 'bounce', cheque })}
                                                                className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded transition-colors"
                                                            >
                                                                Bounce
                                                            </button>
                                                        </>
                                                    )}

                                                    {cheque.status === 'bounced' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActionModal({ type: 'return', cheque })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-50 rounded transition-colors"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Return
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-neutral-400">
                                            No received cheques match current filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Received Cheque Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-lg w-full shadow-xl space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-y-2">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                    Record Received Customer Cheque
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                >
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Cheque Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={createData.cheque_number}
                                            onChange={(e) => setCreateData('cheque_number', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm font-mono"
                                            required
                                        />
                                        {createErrors.cheque_number && <p className="text-2xs text-red-500 mt-1">{createErrors.cheque_number}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Amount <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={createData.amount}
                                            onChange={(e) => setCreateData('amount', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm font-mono"
                                            required
                                        />
                                        {createErrors.amount && <p className="text-2xs text-red-500 mt-1">{createErrors.amount}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Drawer Bank <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. HBL, Meezan"
                                            value={createData.bank_name}
                                            onChange={(e) => setCreateData('bank_name', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Cheque Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            value={createData.cheque_date}
                                            onChange={(e) => setCreateData('cheque_date', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold mb-1">Customer / Party</label>
                                        <PremiumSelect
                                            value={createData.party_id}
                                            onChange={(val) => setCreateData('party_id', val)}
                                            options={[
                                                { value: '', label: '-- Walk-in / General Customer --' },
                                                ...parties.map((p) => ({
                                                    value: String(p.id),
                                                    label: p.name
                                                }))
                                            ]}
                                            placeholder="-- Walk-in / General Customer --"
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold mb-1">Branch / Notes</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Main Branch, Gulberg"
                                            value={createData.notes}
                                            onChange={(e) => setCreateData('notes', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createProcessing}
                                        className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                                    >
                                        {createProcessing ? 'Recording...' : 'Record Cheque'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Deposit Modal */}
                {depositModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-md w-full shadow-xl space-y-4">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                Deposit Cheque #{depositModal.cheque_number}
                            </h3>
                            <p className="text-xs text-neutral-500">
                                Amount: <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(depositModal.amount)}</span>
                            </p>

                            <form onSubmit={handleDepositSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Company Bank Account <span className="text-red-500">*</span></label>
                                    <PremiumSelect
                                        value={depositBankId}
                                        onChange={(val) => setDepositBankId(val)}
                                        options={[
                                            { value: '', label: '-- Select Bank Account --' },
                                            ...bankAccounts.map((b) => ({
                                                value: String(b.id),
                                                label: `${b.name} (${b.bank_name})`
                                            }))
                                        ]}
                                        placeholder="-- Select Bank Account --"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1">Deposit Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={actionDate}
                                        onChange={(e) => setActionDate(e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                    <button
                                        type="button"
                                        onClick={() => setDepositModal(null)}
                                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !depositBankId}
                                        className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                                    >
                                        {submitting ? 'Depositing...' : 'Confirm Deposit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Clear / Bounce / Return Modal */}
                {actionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-md w-full shadow-xl space-y-4">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                                {actionModal.type === 'clear' && `Mark Cheque #${actionModal.cheque.cheque_number} as Cleared`}
                                {actionModal.type === 'bounce' && `Record Bounce for Cheque #${actionModal.cheque.cheque_number}`}
                                {actionModal.type === 'return' && `Return Cheque #${actionModal.cheque.cheque_number} to Customer`}
                            </h3>

                            <form onSubmit={handleActionSubmit} className="space-y-4">
                                {(actionModal.type === 'clear' || actionModal.type === 'bounce') && (
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            value={actionDate}
                                            onChange={(e) => setActionDate(e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                            required
                                        />
                                    </div>
                                )}

                                {(actionModal.type === 'bounce' || actionModal.type === 'return') && (
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Reason / Notes <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder={actionModal.type === 'bounce' ? 'e.g. Insufficient funds / signature mismatch' : 'e.g. Returned after bounce settlement'}
                                            value={actionReason}
                                            onChange={(e) => setActionReason(e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                    <button
                                        type="button"
                                        onClick={() => setActionModal(null)}
                                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm ${
                                            actionModal.type === 'clear' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                            actionModal.type === 'bounce' ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-brand-600 hover:bg-brand-700'
                                        }`}
                                    >
                                        {submitting ? 'Processing...' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
              </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
