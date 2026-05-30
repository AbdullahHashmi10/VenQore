import React, { useState, useMemo } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Repeat,
    Search,
    Plus,
    Download,
    Eye,
    Edit,
    Trash2,
    Play,
    Pause,
    Calendar,
    Clock,
    DollarSign,
    Users
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

export default function RecurringInvoicesIndex({ recurringInvoices = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { showConfirm, showAlert } = useAlert();
    const { store } = usePage().props;

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        return recurringInvoices.filter(item => {
            const matchesSearch = !searchTerm ||
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [recurringInvoices, searchTerm, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: recurringInvoices.length,
            active: recurringInvoices.filter(i => i.status === 'active').length,
            paused: recurringInvoices.filter(i => i.status === 'paused').length,
            monthlyRevenue: recurringInvoices
                .filter(i => i.status === 'active')
                .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
        };
    }, [recurringInvoices]);

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            completed: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
        };
        return styles[status] || styles.active;
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            yearly: 'Yearly'
        };
        return labels[frequency] || frequency;
    };

    const handleToggleStatus = (invoice) => {
        const newStatus = invoice.status === 'active' ? 'paused' : 'active';
        showConfirm({
            title: `${newStatus === 'active' ? 'Resume' : 'Pause'} Recurring Invoice?`,
            message: `This will ${newStatus === 'active' ? 'resume' : 'pause'} automatic invoice generation.`,
            type: 'warning',
            confirmLabel: 'Yes, Continue',
            onConfirm: () => {
                router.post(route('store.recurring-invoices.toggle', invoice.id));
            }
        });
    };

    const handleDelete = (invoice) => {
        showConfirm({
            title: 'Delete Recurring Invoice?',
            message: 'This will stop all future invoices. Existing invoices will remain.',
            type: 'danger',
            confirmLabel: 'Yes, Delete',
            onConfirm: () => {
                router.delete(route('store.recurring-invoices.destroy', invoice.id));
            }
        });
    };

    return (
        <OneGlanceLayout title="Recurring Invoices" activeMenu="Sell">
            <Head title="Recurring Invoices" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Repeat className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                            Recurring Invoices
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Automate invoice generation for subscriptions and regular payments</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {/* Export */ }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium border border-slate-200/80 dark:border-slate-700"
                        >
                            <Download size={18} />
                            Export
                        </button>
                        <Link
                            href={route('store.recurring-invoices.create', { store_slug: store.slug })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold shadow-lg shadow-purple-500/20"
                        >
                            <Plus size={18} />
                            New Recurring
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <Repeat className="text-slate-600 dark:text-slate-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">Total</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <Play className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">Active</p>
                                <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <Pause className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">Paused</p>
                                <p className="text-2xl font-black text-amber-600">{stats.paused}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <DollarSign className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">Monthly Revenue</p>
                                <p className="text-2xl font-black text-purple-600">{(stats.monthlyRevenue < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(stats.monthlyRevenue) || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search by title or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                />
                            </div>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none font-semibold text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-100/70 dark:bg-slate-850 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                                    <th className="px-6 py-4 text-left">Title</th>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Frequency</th>
                                    <th className="px-6 py-4 text-left">Next Invoice</th>
                                    <th className="px-6 py-4 text-center">Generated</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <Repeat size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                            <p className="text-slate-600 dark:text-slate-300 font-bold">No recurring invoices found</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create one to automate your billing</p>
                                            <Link
                                                href={route('store.recurring-invoices.create', { store_slug: store.slug })}
                                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-md"
                                            >
                                                <Plus size={18} />
                                                Create Recurring Invoice
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800 dark:text-white">
                                                    {invoice.title || `Recurring #${invoice.id}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                        <Users size={14} className="text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {invoice.customer?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-slate-800 dark:text-white">
                                                    {(parseFloat(invoice.amount || 0) < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(parseFloat(invoice.amount || 0)) || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-bold">
                                                    {getFrequencyLabel(invoice.frequency)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Calendar size={14} />
                                                    {invoice.next_invoice_date ? new Date(invoice.next_invoice_date).toLocaleDateString() : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-slate-800 dark:text-white">
                                                    {invoice.invoices_generated || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(invoice.status)}`}>
                                                    {invoice.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleToggleStatus(invoice)}
                                                        className={`p-2 rounded-lg transition-all ${invoice.status === 'active'
                                                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                            }`}
                                                        title={invoice.status === 'active' ? 'Pause' : 'Resume'}
                                                    >
                                                        {invoice.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                                    </button>
                                                    <Link
                                                        href={route('store.recurring-invoices.edit', invoice.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <Edit size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(invoice)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
