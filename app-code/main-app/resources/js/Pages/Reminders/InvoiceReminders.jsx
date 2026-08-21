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
    XCircle,
    Printer,
    ChevronDown,
    ChevronUp,
    X
} from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import SellModuleTabs from '@/Components/SellModuleTabs';

export default function InvoiceReminders({ reminders = { data: [], links: [] }, stats = {}, filters = {} }) {
    const {
        store
    } = usePage().props;

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
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
            cancelled: 'bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted',
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
            <div className="flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative">
                <SellModuleTabs activeTab="reminders" />

                {/* Mobile Stats Toggle/Summary */}
                <div className="flex md:hidden items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0">
                    <button
                        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                        className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2"
                    >
                        <span>Stats Summary</span>
                        <ChevronDown size={16} className={`transition-transform duration-normal ${isStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {!isStatsExpanded && (
                        <div className="flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary">
                            <div className="flex items-center gap-2">
                                <span className="text-brand-600 dark:text-brand-400">Total: {stats.total || 0}</span>
                                <span className="text-neutral-300 dark:text-ink-secondary">|</span>
                                <span className="text-amber-600">Pending: {stats.pending || 0}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards Section - Compact Single Line */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? 'grid' : 'hidden md:grid'}`}>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <Bell size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Scheduled</p>
                        </div>
                        <p className="text-base font-bold text-ink">{stats.total || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Pending</p>
                        </div>
                        <p className="text-base font-bold text-amber-600">{stats.pending || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Sent</p>
                        </div>
                        <p className="text-base font-bold text-emerald-600">{stats.sent || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Overdue</p>
                        </div>
                        <p className="text-base font-bold text-red-600">{stats.overdue || 0}</p>
                    </div>
                </div>

                {/* PC / Desktop Header Area (Hidden on Mobile) */}
                <div className="hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Invoice <span className="text-brand-600">Reminders</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        <button
                            onClick={() => handleStatusChange('all')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                        >All</button>
                        <button
                            onClick={() => handleStatusChange('pending')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'pending' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                        >Pending</button>
                        <button
                            onClick={() => handleStatusChange('sent')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'sent' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                        >Sent</button>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="w-64 relative">
                            <input
                                type="text"
                                placeholder="Search by invoice or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-2 border-l border-line pl-2">
                            <Link
                                href={route('store.invoice-reminders.create', { store_slug: store.slug })}
                                className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={18} />
                                <span className="text-sm font-bold hidden sm:inline">New Reminder</span>
                            </Link>
                            <button className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted" title="Print" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout Header Area */}
                <div className="flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-sm font-bold text-ink uppercase tracking-tight">
                            Invoice Reminders
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => { setShowMobileSearch(!showMobileSearch); if (showMobileFilters) setShowMobileFilters(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <button
                                onClick={() => { setShowMobileFilters(!showMobileFilters); if (showMobileSearch) setShowMobileSearch(false); }}
                                className={`p-2 rounded-lg transition-colors ${showMobileFilters ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted hover:bg-interactive-hover'}`}
                                title="Filters"
                            >
                                <ChevronDown size={16} />
                            </button>
                            <Link
                                href={route('store.invoice-reminders.create', { store_slug: store.slug })}
                                className="p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors"
                                title="New Reminder"
                            >
                                <Plus size={16} />
                            </Link>
                        </div>
                    </div>

                    {showMobileSearch && (
                        <div className="w-full relative mt-1 border-t border-line pt-2">
                            <input
                                type="text"
                                placeholder="Search by invoice or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink"
                            />
                            <Search className="absolute left-3 top-[65%] -translate-y-1/2 text-ink-muted pointer-events-none" size={14} />
                        </div>
                    )}

                    {showMobileFilters && (
                        <div className="w-full mt-1 border-t border-line pt-2 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => handleStatusChange('all')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                >All</button>
                                <button
                                    onClick={() => handleStatusChange('pending')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'pending' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                >Pending</button>
                                <button
                                    onClick={() => handleStatusChange('sent')}
                                    className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === 'sent' ? 'bg-brand-600 text-white' : 'bg-sunken text-ink-muted'}`}
                                >Sent</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Table / Layout Wrapper */}
                <div className="flex-1 overflow-auto md:rounded-xl md:border md:border-line md:dark:border-line md:shadow-sm bg-transparent md:bg-white md:dark:bg-app flex flex-col justify-between">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app text-ink-muted font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                                <tr className="border-b border-line">
                                    <th className="px-6 py-3 text-left">Invoice</th>
                                    <th className="px-6 py-3 text-left">Customer</th>
                                    <th className="px-6 py-3 text-left">Scheduled For</th>
                                    <th className="px-6 py-3 text-center">Type</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {reminderList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Bell size={48} className="mx-auto text-neutral-300 dark:text-ink-secondary mb-4" />
                                            <p className="text-ink-muted font-medium">No scheduled reminders found</p>
                                            <p className="text-ink-muted text-sm mt-1">Schedule a reminder to notify customers</p>
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
                                        <tr key={reminder.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-ink-muted" />
                                                    <Link
                                                        href={route("store.sales.show", [store.slug, reminder.invoice_id])}
                                                        className="font-medium text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400"
                                                    >
                                                        {reminder.invoice?.reference_number || 'Unknown Invoice'}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-ink-muted" />
                                                    <span className="font-medium text-ink">
                                                        {reminder.customer?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-ink-secondary">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {new Date(reminder.scheduled_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-sunken rounded-lg text-sm text-ink-secondary">
                                                    {reminder.type === 'email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                                                    <span className="capitalize">{reminder.type}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(reminder.status)}`}>
                                                    {reminder.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {reminder.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleSendNow(reminder)}
                                                        className="p-2 text-ink-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
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

                    {/* Mobile View - Cards List */}
                    <div className="md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent">
                        {reminderList.length === 0 ? (
                            <div className="bg-surface rounded-xl p-8 text-center border border-line">
                                <Bell size={32} className="mx-auto text-ink-muted mb-2" />
                                <p className="text-sm font-bold text-ink-secondary">No scheduled reminders found</p>
                            </div>
                        ) : (
                            reminderList.map((reminder) => (
                                <div
                                    key={reminder.id}
                                    className="bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-3 transition-transform"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <FileText size={14} className="text-ink-muted" />
                                                <Link
                                                    href={route("store.sales.show", [store.slug, reminder.invoice_id])}
                                                    className="font-bold text-sm text-brand-600 dark:text-brand-400 hover:underline"
                                                >
                                                    {reminder.invoice?.reference_number || 'Unknown Invoice'}
                                                </Link>
                                            </div>
                                            <div className="flex items-center gap-1 text-2xs text-ink-muted mt-1">
                                                <Calendar size={10} />
                                                <span>Sched: {new Date(reminder.scheduled_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${getStatusBadge(reminder.status)}`}>
                                            {reminder.status || 'pending'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-b border-line py-2.5">
                                        <div>
                                            <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">Customer</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <User size={12} className="text-ink-muted" />
                                                <span className="text-xs font-bold text-ink">{reminder.customer?.name || 'Unknown'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">Type</p>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sunken rounded-md text-2xs font-semibold text-ink-secondary mt-0.5">
                                                {reminder.type === 'email' ? <Mail size={10} /> : <MessageSquare size={10} />}
                                                <span className="capitalize">{reminder.type}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <div></div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            {reminder.status === 'pending' && (
                                                <button
                                                    onClick={() => handleSendNow(reminder)}
                                                    className="px-3 py-1.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg font-bold transition-all shadow-md flex items-center gap-1 text-1xs"
                                                >
                                                    <Send size={12} />
                                                    <span>Send Now</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-line bg-surface">
                        <Pagination links={reminders.links} />
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
