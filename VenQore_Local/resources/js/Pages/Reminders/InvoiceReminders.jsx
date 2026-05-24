import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Pagination from '@/Components/Pagination';
import { useDebounce } from 'use-debounce';
import {
    Bell,
    Search,
    Plus,
    Download,
    Calendar,
    Send,
    CheckCircle,
    Clock,
    Mail,
    MessageSquare,
    User,
    FileText,
    XCircle
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';

export default function InvoiceReminders({ reminders = { data: [], links: [] }, stats = {}, filters = {} }) {
    const {
        store
    } = usePage().props;

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const { showConfirm, showAlert } = useAlert();

    // Trigger server-side search
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(route('store.invoice-reminders.index', { store_slug: store.slug }), {
                search: debouncedSearch,
                status: statusFilter === 'all' ? null : statusFilter
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            });
        }
    }, [debouncedSearch]);

    // Trigger status filter
    const handleStatusChange = (status) => {
        setStatusFilter(status);
        router.get(route('store.invoice-reminders.index', { store_slug: store.slug }), {
            search: searchTerm,
            status: status === 'all' ? null : status
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
        };
        return styles[status] || styles.pending;
    };

    const handleSendNow = (reminder) => {
        showConfirm({
            title: 'Send Reminder Now?',
            message: `This will immediately send the reminder to ${reminder.customer?.name}.`,
            type: 'info',
            confirmLabel: 'Send Now',
            onConfirm: () => {
                router.post(route('store.invoice-reminders.send', reminder.id), {}, {
                    onSuccess: () => showAlert({ title: 'Sent', message: 'Reminder sent successfully', type: 'success' })
                });
            }
        });
    };

    const reminderList = reminders.data || [];

    return (
        <OneGlanceLayout title="Invoice Reminders" activeMenu="Sales">
            <Head title="Invoice Reminders" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                <Bell className="text-orange-600 dark:text-orange-400" size={24} />
                            </div>
                            Invoice Reminders
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage automated payment reminders for overdue invoices</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {/* Export */ }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                            <Download size={18} />
                            Export
                        </button>
                        <Link
                            href={route('store.invoice-reminders.create', { store_slug: store.slug })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold shadow-lg shadow-orange-500/20"
                        >
                            <Plus size={18} />
                            Schedule Reminder
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <Bell className="text-slate-600 dark:text-slate-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Total Scheduled</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Pending</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.pending || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Sent</p>
                                <p className="text-2xl font-black text-emerald-600">{stats.sent || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                <Clock className="text-red-600 dark:text-red-400" size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Overdue</p>
                                <p className="text-2xl font-black text-red-600">{stats.overdue || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by invoice or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-orange-500/20 outline-none"
                                />
                            </div>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-orange-500/20 outline-none font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left">Invoice</th>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-left">Scheduled For</th>
                                    <th className="px-6 py-4 text-center">Type</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {reminderList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Bell size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                            <p className="text-slate-500 font-medium">No scheduled reminders found</p>
                                            <p className="text-slate-400 text-sm mt-1">Schedule a reminder to automatically notify customers about due payments</p>
                                            <Link
                                                href={route('store.invoice-reminders.create', { store_slug: store.slug })}
                                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                                            >
                                                <Plus size={18} />
                                                New Reminder
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    reminderList.map((reminder) => (
                                        <tr key={reminder.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-slate-400" />
                                                    <Link
                                                        href={route("store.sales.show", [store.slug, reminder.invoice_id])}
                                                        className="font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    >
                                                        {reminder.invoice?.reference_number || 'Unknown Invoice'}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="font-medium text-slate-800 dark:text-white">
                                                        {reminder.customer?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {new Date(reminder.scheduled_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                                    {reminder.type === 'email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                                                    <span className="capitalize">{reminder.type}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(reminder.status)}`}>
                                                    {reminder.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {reminder.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleSendNow(reminder)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                        title="Send Now"
                                                    >
                                                        <Send size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <Pagination links={reminders.links} />
                    <div className="h-4"></div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
