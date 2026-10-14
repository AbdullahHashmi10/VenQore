import PrintService from '@/Utils/PrintService';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import Pagination from '@/Components/Pagination';
import { useDebounce } from 'use-debounce';
import { Bell, Search, Plus, Download, Calendar, Send, CheckCircle, Clock, Mail, MessageSquare, User, FileText, XCircle, Printer, ChevronDown, ChevronUp, X, Filter, Check } from 'lucide-react';
import { useAlert } from '@/Contexts/AlertContext';
import SellModuleTabs, { useSellNavGroups } from '@/Components/SellModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import { useTermText } from '@/lib/terms';
import MobileStats from '@/Components/MobileStats';

export default function InvoiceReminders({ reminders = { data: [], links: [] }, stats = {}, filters = {} }) {
    const {
        store
    } = usePage().props;
    const navGroups = useSellNavGroups();
    const tt = useTermText();

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
            marked_sent_manually: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            ready_for_draft: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            opened: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            settled: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            dismissed: 'bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted',
            failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            cancelled: 'bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted',
        };
        return styles[status] || styles.pending;
    };

    const handleSendNow = async (reminder) => {
        if (reminder.type === 'whatsapp') {
            try {
                const res = await axios.post(
                    route('store.invoice-reminders.send', { store_slug: store.slug, id: reminder.id }),
                    {},
                    { headers: { 'Accept': 'application/json' } }
                );
                if (res.data?.action === 'open_whatsapp_draft' && res.data?.url) {
                    window.open(res.data.url, '_blank', 'noopener,noreferrer');
                    showAlert({ title: 'Draft Opened', message: 'WhatsApp draft opened in new tab. Please review and send.', type: 'info' });
                    router.reload({ preserveScroll: true });
                } else if (res.data?.settled) {
                    showAlert({ title: 'Invoice Settled', message: res.data.message, type: 'info' });
                    router.reload({ preserveScroll: true });
                }
            } catch (err) {
                showAlert({ title: 'Failed', message: err.response?.data?.message || err.message, type: 'error' });
            }
            return;
        }

        showConfirm({
            title: 'Send Email Reminder?',
            message: `Send payment reminder email to ${reminder.customer?.name}?`,
            type: 'info',
            confirmLabel: 'Send Email',
            onConfirm: () => {
                router.post(route('store.invoice-reminders.send', { store_slug: store.slug, id: reminder.id }), {}, {
                    onSuccess: () => showAlert({ title: 'Sent', message: 'Email reminder sent successfully', type: 'success' })
                });
            }
        });
    };

    const handleMarkSentManually = (reminder) => {
        router.post(route('store.invoice-reminders.mark-sent-manually', { store_slug: store.slug, id: reminder.id }), {}, {
            preserveScroll: true,
            onSuccess: () => showAlert({ title: 'Marked', message: 'Reminder recorded as sent manually by staff.', type: 'success' })
        });
    };

    const handleDismiss = (reminder) => {
        router.post(route('store.invoice-reminders.dismiss', { store_slug: store.slug, id: reminder.id }), {}, {
            preserveScroll: true,
            onSuccess: () => showAlert({ title: 'Dismissed', message: 'Reminder dismissed.', type: 'info' })
        });
    };

    const reminderList = reminders.data || [];

    return (
        <OneGlanceLayout title="Invoice Reminders" activeMenu="Sales" noPadding>
            <Head title="Invoice Reminders" />
            <ListPageFrame className="flex flex-col min-h-full bg-app p-2.5 gap-1">
                <div className="md:hidden"><SellModuleTabs activeTab="reminders" /></div>

                {/* Desktop header: row 1 toolbar, row 2 stat cards */}
                <ListToolbar
                    title="Invoice Reminders"
                    navGroups={navGroups}
                    activeId="reminders"
                    left={(
                        <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)} className="h-10 pl-3 pr-8 rounded-[12px] border border-line bg-surface text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer hover:bg-interactive-hover" aria-label="Status">
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                        </select>
                    )}
                    search={{ value: searchTerm, onChange: (v) => setSearchTerm(v), placeholder: tt('Search by invoice or customer...') }}
                    actions={(
                        <>
                            <button type="button" className="h-10 w-10 rounded-[12px] border border-line bg-surface flex items-center justify-center hover:bg-interactive-hover transition-colors text-ink-muted" title="Print" onClick={() => PrintService.printPage()}><Printer size={18} /></button>
                            <ListAddButton href={route('store.invoice-reminders.create', { store_slug: store.slug })} icon={Plus}>New Reminder</ListAddButton>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Total Scheduled', value: stats.total || 0, icon: Bell, icon_tone: 'bg-brand-100 text-brand-600' },
                    { label: 'Pending', value: stats.pending || 0, icon: Clock, icon_tone: 'bg-amber-100 text-amber-600', value_tone: 'text-amber-600' },
                    { label: 'Sent', value: stats.sent || 0, icon: CheckCircle, icon_tone: 'bg-emerald-100 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'Overdue', value: stats.overdue || 0, icon: Clock, icon_tone: 'bg-red-100 text-red-600', value_tone: 'text-red-600' },
                ]} />

               {/* Mobile header (phone only) */}
 <div className="md:hidden relative z-40 shrink-0 bg-surface border border-line rounded-[14px] shadow-sm">
 {showMobileFilters && <div className="fixed inset-0 z-30" onClick={() => setShowMobileFilters(false)} aria-hidden="true" />}
 <div className="relative z-40 h-12 flex items-center gap-1 px-1.5">
 <div className="min-w-0 flex-1 pl-2">
 <span className="text-[15px] font-bold text-ink tracking-tight truncate block">Invoice Reminders</span>
 </div>
 <div>
 <button type="button" onClick={() => setShowMobileFilters(!showMobileFilters)} aria-haspopup="listbox" aria-expanded={showMobileFilters} aria-label="Filter"
 className={`h-9 px-2 rounded-[10px] border flex items-center gap-1 transition-colors ${statusFilter !== 'all' ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-line bg-app text-ink-secondary'}`}>
 <Filter size={16} />
 <ChevronDown size={14} className={`transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
 </button>
 {showMobileFilters && (
 <div role="listbox" className="absolute left-0 right-0 top-full mt-1 max-h-[60vh] overflow-y-auto bg-surface border border-line rounded-[12px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
 {[['all', 'All'], ['pending', 'Pending'], ['sent', 'Sent']].map(([key, label]) => (
 <button key={key} type="button" role="option" aria-selected={statusFilter === key} onClick={() => { handleStatusChange(key); setShowMobileFilters(false); }}
 className={`w-full h-10 px-3 rounded-[8px] text-sm text-left flex items-center justify-between gap-2 ${statusFilter === key ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-interactive-hover'}`}>
 <span className="truncate">{label}</span>
 {statusFilter === key && <Check size={15} className="shrink-0" />}
 </button>
 ))}
 </div>
 )}
 </div>
 <button type="button" onClick={() => setShowMobileSearch(!showMobileSearch)} aria-label="Search"
 className={`h-9 w-9 rounded-[10px] flex items-center justify-center transition-colors ${showMobileSearch || searchTerm ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-app text-ink-secondary'}`}>
 <Search size={17} />
 </button>
 <Link href={route('store.invoice-reminders.create', { store_slug: store.slug })} aria-label="New Reminder"
 className="h-9 w-9 rounded-[10px] bg-brand-600 text-white flex items-center justify-center shadow-sm active:bg-brand-700">
 <Plus size={19} />
 </Link>
 </div>
 {showMobileSearch && (
 <div className="px-1.5 pb-1.5 -mt-0.5">
 <div className="relative">
 <input autoFocus type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={tt('Search by invoice or customer...')}
 className="w-full h-10 pl-9 pr-3 text-sm bg-app border border-line rounded-[10px] text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={15} />
 </div>
 </div>
 )}
 </div>

 <MobileStats bp="md" hero={3} items={[
 { label: 'Total Scheduled', value: stats.total || 0, tone: 'brand', icon: Bell },
 { label: 'Pending', value: stats.pending || 0, tone: 'amber', icon: Clock },
 { label: 'Sent', value: stats.sent || 0, tone: 'emerald', icon: CheckCircle },
 { label: 'Overdue', value: stats.overdue || 0, tone: 'red', icon: Clock }
 ]} />

  {/* Main Table / Layout Wrapper */}
                <div className="flex-1 md:min-h-0 overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm bg-transparent md:bg-surface flex flex-col justify-between">
                    <div className="hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app text-ink-muted font-bold uppercase text-2xs tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                                <tr className="border-b border-line">
                                    <th className="sticky top-0 z-10 bg-app px-6 py-3 text-left">Invoice</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-3 text-left">{tt('Customer')}</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-3 text-left">Scheduled For</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Type</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Status</th>
                                    <th className="sticky top-0 z-10 bg-app px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {reminderList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Bell size={48} className="mx-auto text-neutral-300 dark:text-ink-secondary mb-4" />
                                            <p className="text-ink-muted font-medium">No scheduled reminders found</p>
                                            <p className="text-ink-muted text-sm mt-1">{tt('Schedule a reminder to notify customers')}</p>
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
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {['pending', 'ready_for_draft', 'opened'].includes(reminder.status) && (
                                                        <button
                                                            onClick={() => handleSendNow(reminder)}
                                                            className="p-2 text-ink-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                            title={reminder.type === 'whatsapp' ? 'Open WhatsApp Draft' : 'Send Email'}
                                                        >
                                                            {reminder.type === 'whatsapp' ? <MessageSquare size={16} className="text-emerald-600" /> : <Send size={16} />}
                                                        </button>
                                                    )}
                                                    {reminder.type === 'whatsapp' && ['pending', 'ready_for_draft', 'opened'].includes(reminder.status) && (
                                                        <button
                                                            onClick={() => handleMarkSentManually(reminder)}
                                                            className="p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all"
                                                            title="Mark Sent Manually (Staff self-report)"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    {['pending', 'ready_for_draft', 'opened'].includes(reminder.status) && (
                                                        <button
                                                            onClick={() => handleDismiss(reminder)}
                                                            className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title="Dismiss Reminder"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
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
                            <div className="bg-surface rounded-xl p-4 sm:p-8 text-center border border-line">
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
                                            <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">{tt('Customer')}</p>
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
                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            {['pending', 'ready_for_draft', 'opened'].includes(reminder.status) && (
                                                <button
                                                    onClick={() => handleSendNow(reminder)}
                                                    className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1 text-2xs"
                                                >
                                                    {reminder.type === 'whatsapp' ? <MessageSquare size={12} /> : <Send size={12} />}
                                                    <span>{reminder.type === 'whatsapp' ? 'Draft' : 'Send'}</span>
                                                </button>
                                            )}
                                            {reminder.type === 'whatsapp' && ['pending', 'ready_for_draft', 'opened'].includes(reminder.status) && (
                                                <button
                                                    onClick={() => handleMarkSentManually(reminder)}
                                                    className="px-2 py-1.5 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 rounded-lg font-bold text-2xs flex items-center gap-1"
                                                    title="Mark Sent Manually"
                                                >
                                                    <CheckCircle size={12} />
                                                </button>
                                            )}
                                            {['pending', 'ready_for_draft', 'opened'].includes(reminder.status) && (
                                                <button
                                                    onClick={() => handleDismiss(reminder)}
                                                    className="px-2 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg font-bold text-2xs flex items-center gap-1"
                                                    title="Dismiss"
                                                >
                                                    <XCircle size={12} />
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
