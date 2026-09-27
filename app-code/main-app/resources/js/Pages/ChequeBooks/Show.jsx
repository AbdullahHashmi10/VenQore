import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { getCurrencySymbol } from '@/Utils/format';
import {
    BookOpen, ArrowLeft, Building2, Search, CheckCircle2,
    Clock, AlertTriangle, XCircle, Ban, Filter, ShieldCheck
} from 'lucide-react';

const formatCurrency = (val) =>
    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));

export default function ChequeBookShow({ chequeBook, leaves, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [modalAction, setModalAction] = useState(null); // { type: 'void'|'stop'|'bounce'|'clear', leaf }
    const [actionReason, setActionReason] = useState('');
    const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    const handleFilterChange = (newFilters) => {
        router.get(route('store.banking.cheque-books.show', chequeBook.id), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            status: newFilters.status !== undefined ? newFilters.status : statusFilter,
        }, { preserveState: true, replace: true });
    };

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (!modalAction) return;

        setSubmitting(true);
        const { type, leaf } = modalAction;

        let url = '';
        let payload = {};

        if (type === 'void') {
            url = route('store.banking.cheque-leaves.void', leaf.id);
            payload = { reason: actionReason };
        } else if (type === 'stop') {
            url = route('store.banking.cheque-leaves.stop', leaf.id);
            payload = { reason: actionReason };
        } else if (type === 'clear') {
            url = route('store.banking.cheque-leaves.clear', leaf.id);
            payload = { clear_date: actionDate };
        } else if (type === 'bounce') {
            url = route('store.banking.cheque-leaves.bounce', leaf.id);
            payload = { reason: actionReason, bounce_date: actionDate };
        }

        router.post(url, payload, {
            onSuccess: () => {
                setModalAction(null);
                setActionReason('');
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'available':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
            case 'reserved':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
            case 'issued':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
            case 'cleared':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
            case 'bounced':
                return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
            case 'stopped':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300';
            case 'void':
                return 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
            default:
                return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
        }
    };

    return (
        <OneGlanceLayout>
            <Head title={`Chequebook ${chequeBook.series_prefix ? chequeBook.series_prefix + '-' : ''}${chequeBook.start_number}`} />

            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.banking.cheque-books.index')}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-brand-600" />
                                Chequebook: {chequeBook.series_prefix ? `${chequeBook.series_prefix}-` : ''}
                                {String(chequeBook.start_number).padStart(chequeBook.padding_zeros || 6, '0')} ... {String(chequeBook.end_number).padStart(chequeBook.padding_zeros || 6, '0')}
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {chequeBook.bank_account?.name} ({chequeBook.bank_account?.bank_name})
                                {chequeBook.bank_account?.account_number ? ` • Account #${chequeBook.bank_account.account_number}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            chequeBook.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
                        }`}>
                            {chequeBook.status}
                        </span>
                    </div>
                </div>

                {/* Subnavigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" />

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-neutral-500">Total Leaves</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {chequeBook.total_leaves_count || chequeBook.total_leaves}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Available</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                            {chequeBook.available_leaves_count || 0}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800/40 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Reserved</p>
                        <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                            {chequeBook.reserved_leaves_count || 0}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800/40 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Issued</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                            {chequeBook.issued_leaves_count || 0}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-800/40 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Cleared</p>
                        <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                            {chequeBook.cleared_leaves_count || 0}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-800/40 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Bounced</p>
                        <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">
                            {chequeBook.bounced_leaves_count || 0}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-2xs font-bold uppercase tracking-wider text-neutral-500">Void / Stopped</p>
                        <p className="text-xl font-bold text-neutral-700 dark:text-neutral-300 mt-1">
                            {(chequeBook.void_leaves_count || 0) + (chequeBook.stopped_leaves_count || 0)}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search cheque number, payee name, notes..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilterChange({ search: e.target.value });
                            }}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm text-neutral-900 dark:text-neutral-100"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleFilterChange({ status: e.target.value });
                        }}
                        className="py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-sm text-neutral-900 dark:text-neutral-100 w-full md:w-auto"
                    >
                        <option value="">All Leaf Statuses</option>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="issued">Issued</option>
                        <option value="cleared">Cleared</option>
                        <option value="bounced">Bounced</option>
                        <option value="stopped">Stopped</option>
                        <option value="void">Void</option>
                    </select>
                </div>

                {/* Leaves Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3.5">Cheque Number</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Payee / Party</th>
                                    <th className="px-6 py-3.5">Amount</th>
                                    <th className="px-6 py-3.5">Cheque Date</th>
                                    <th className="px-6 py-3.5">Notes / Reason</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {leaves.data && leaves.data.length > 0 ? (
                                    leaves.data.map((leaf) => (
                                        <tr key={leaf.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {leaf.display_serial_number}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadge(leaf.status)}`}>
                                                    {leaf.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                {leaf.party?.name || leaf.payment?.party?.name || (
                                                    <span className="text-neutral-400 italic">—</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                {leaf.amount ? formatCurrency(leaf.amount) : '—'}
                                            </td>

                                            <td className="px-6 py-4 text-xs">
                                                {leaf.cheque_date || '—'}
                                            </td>

                                            <td className="px-6 py-4 text-xs text-neutral-500 max-w-xs truncate">
                                                {leaf.status_reason || (
                                                    leaf.reserved_by_approval_document_id ? (
                                                        <span className="text-amber-600 font-medium">
                                                            Pending Approval #{leaf.reserved_by_approval_document_id}
                                                        </span>
                                                    ) : '—'
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {leaf.status === 'available' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setModalAction({ type: 'void', leaf })}
                                                            className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                        >
                                                            Void Leaf
                                                        </button>
                                                    )}

                                                    {leaf.status === 'issued' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setModalAction({ type: 'clear', leaf })}
                                                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setModalAction({ type: 'bounce', leaf })}
                                                                className="px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded transition-colors"
                                                            >
                                                                Bounce
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setModalAction({ type: 'stop', leaf })}
                                                                className="px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded transition-colors"
                                                            >
                                                                Stop
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-neutral-400">
                                            No cheque leaves match current filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Leaf Action Modal */}
                {modalAction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 max-w-md w-full shadow-xl space-y-4">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize">
                                {modalAction.type === 'void' && `Void Cheque Leaf (${modalAction.leaf.display_serial_number})`}
                                {modalAction.type === 'stop' && `Stop Payment on Cheque (${modalAction.leaf.display_serial_number})`}
                                {modalAction.type === 'clear' && `Mark Cheque as Cleared (${modalAction.leaf.display_serial_number})`}
                                {modalAction.type === 'bounce' && `Record Cheque Bounce (${modalAction.leaf.display_serial_number})`}
                            </h3>

                            <form onSubmit={handleActionSubmit} className="space-y-4">
                                {(modalAction.type === 'clear' || modalAction.type === 'bounce') && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={actionDate}
                                            onChange={(e) => setActionDate(e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-sm"
                                            required
                                        />
                                    </div>
                                )}

                                {(modalAction.type === 'void' || modalAction.type === 'stop' || modalAction.type === 'bounce') && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                            Reason / Notes <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={
                                                modalAction.type === 'void' ? 'e.g. Printed incorrectly / damaged leaf' :
                                                modalAction.type === 'stop' ? 'e.g. Lost in transit / disputed transaction' :
                                                'e.g. Insufficient bank funds'
                                            }
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
                                        onClick={() => setModalAction(null)}
                                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm ${
                                            modalAction.type === 'clear'
                                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                                : modalAction.type === 'bounce'
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-brand-600 hover:bg-brand-700'
                                        }`}
                                    >
                                        {submitting ? 'Processing...' : 'Confirm'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
