import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    MessageSquare, Sparkles, Clock, CheckCircle, AlertCircle,
    ChevronRight, RefreshCw, Filter, Inbox, Bot, Zap, User, Plus
} from 'lucide-react';

// ── Escalation type badge config ─────────────────────────────────────────────
const ESCALATION_CONFIG = {
    ai_failure: {
        label: 'AI Failure',
        color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        icon: Bot,
    },
    billing_or_complex: {
        label: 'Billing / Complex',
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: AlertCircle,
    },
    user_requested: {
        label: 'User Requested',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: User,
    },
    repeated_failure: {
        label: 'Repeated Failure',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: Zap,
    },
};

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
    open: {
        label: 'Open',
        color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
    },
    in_progress: {
        label: 'In Progress',
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
    resolved: {
        label: 'Resolved',
        color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
    },
    closed: {
        label: 'Closed',
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function EscalationBadge({ type }) {
    const cfg = ESCALATION_CONFIG[type];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${cfg.color}`}>
            <Icon size={9} />
            {cfg.label}
        </span>
    );
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 1) return `${Math.round(diffHours * 60)}m ago`;
    if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function VenaTickets({ tickets, context, filters, open_count }) {
    const { store } = usePage().props;
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [escalationFilter, setEscalationFilter] = useState(filters?.escalation_type || 'all');

    const [openModal, setOpenModal] = useState(false);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formPriority, setFormPriority] = useState('normal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        if (!formName.trim() || !formEmail.trim() || !formSubject.trim() || !formMessage.trim()) return;

        setIsSubmitting(true);
        router.post(route('store.admin.vena.ticket.create', { store_slug: store?.slug }), {
            requester_name: formName,
            requester_email: formEmail,
            subject: formSubject,
            message: formMessage,
            priority: formPriority,
        }, {
            onSuccess: () => {
                setFormName('');
                setFormEmail('');
                setFormSubject('');
                setFormMessage('');
                setFormPriority('normal');
                setOpenModal(false);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    }

    const isPlatform = context === 'platform';

    const applyFilters = (newFilters) => {
        const params = { ...newFilters };
        if (isPlatform) {
            router.get(route('platform.vena.tickets'), params, { preserveState: true, replace: true });
        } else {
            router.get(route('store.admin.vena.tickets', { store_slug: store?.slug }), params, { preserveState: true, replace: true });
        }
    };

    const handleStatusChange = (val) => {
        setStatusFilter(val);
        applyFilters({ status: val, escalation_type: escalationFilter });
    };

    const handleEscalationChange = (val) => {
        setEscalationFilter(val);
        applyFilters({ status: statusFilter, escalation_type: val });
    };

    const handleStatusUpdate = (ticket, newStatus) => {
        const routeName = isPlatform ? 'platform.vena.ticket.status' : 'store.admin.vena.ticket.status';
        const params = isPlatform
            ? { ticket: ticket.id }
            : { store_slug: store?.slug, ticket: ticket.id };

        router.post(route(routeName, params), { status: newStatus }, { preserveScroll: true });
    };

    return (
        <OneGlanceLayout mode="admin" title="Vena Tickets" activeMenu="Vena Tickets">
            <Head title="Vena Chat Tickets" />

            <div className="h-full flex flex-col gap-4 overflow-hidden">
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                Vena Chat Tickets
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isPlatform
                                    ? 'Auto-generated tickets from Vena chat escalations across all stores'
                                    : 'Customer support tickets raised through your store\'s Vena chat widget'}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        {open_count > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                                    {open_count} open {open_count === 1 ? 'ticket' : 'tickets'}
                                </span>
                            </div>
                        )}

                        {!isPlatform && (
                            <button
                                onClick={() => setOpenModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 shadow-sm shadow-indigo-500/10"
                            >
                                <Plus size={12} />
                                Log Ticket
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="shrink-0 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <Filter size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {isPlatform && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <Filter size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Reason:</span>
                            <select
                                value={escalationFilter}
                                onChange={(e) => handleEscalationChange(e.target.value)}
                                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="ai_failure">AI Failure</option>
                                <option value="billing_or_complex">Billing / Complex</option>
                                <option value="user_requested">User Requested</option>
                                <option value="repeated_failure">Repeated Failure</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Ticket list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tickets.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mb-4">
                                <Inbox size={28} className="text-indigo-400" />
                            </div>
                            <h3 className="text-base font-black text-slate-700 dark:text-slate-200">No tickets found</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Vena tickets appear here when chat escalations occur and agents are offline.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tickets.data.map((ticket) => {
                                const showRoute = isPlatform
                                    ? route('platform.vena.ticket.show', { ticket: ticket.id })
                                    : route('store.admin.vena.ticket.show', { store_slug: store?.slug, ticket: ticket.id });

                                return (
                                    <div
                                        key={ticket.id}
                                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/5 relative overflow-hidden"
                                    >
                                        {/* Left accent stripe for open tickets */}
                                        {ticket.status === 'open' && (
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose-500 rounded-l-2xl" />
                                        )}

                                        {/* Icon */}
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center">
                                            <MessageSquare size={16} className="text-indigo-500 dark:text-indigo-400" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <StatusBadge status={ticket.status} />
                                                        <EscalationBadge type={ticket.escalation_type} />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {ticket.subject}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            <span className="font-bold">{ticket.requester_name}</span>
                                                            {ticket.requester_email && ` · ${ticket.requester_email}`}
                                                        </span>
                                                        {isPlatform && ticket.tenant && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
                                                                {ticket.tenant.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Time + actions */}
                                                <div className="shrink-0 flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                        <Clock size={10} />
                                                        {formatTime(ticket.created_at)}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {/* Quick status toggle */}
                                                        {ticket.status === 'open' && (
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); handleStatusUpdate(ticket, 'in_progress'); }}
                                                                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                                            >
                                                                Pick Up
                                                            </button>
                                                        )}
                                                        {ticket.status === 'in_progress' && (
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); handleStatusUpdate(ticket, 'resolved'); }}
                                                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                                            >
                                                                Resolve
                                                            </button>
                                                        )}

                                                        {/* View detail */}
                                                        <Link
                                                            href={showRoute}
                                                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
                                                        >
                                                            <ChevronRight size={14} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {tickets.last_page > 1 && (
                    <div className="shrink-0 flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400">
                            Showing {tickets.from}–{tickets.to} of {tickets.total} tickets
                        </span>
                        <div className="flex gap-1.5">
                            {tickets.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                        link.active
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : link.url
                                                ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    preserveState
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>

            {/* Modal Form Dialog */}
            {openModal && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-scale-up" style={{ animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Log New Customer Ticket</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Record customer issues manually while on the call or in-store</p>
                            </div>
                            <button onClick={() => setOpenModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-lg p-1">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Customer Name</label>
                                    <input 
                                        type="text" required placeholder="e.g. John Doe"
                                        value={formName} onChange={e => setFormName(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Customer Email</label>
                                    <input 
                                        type="email" required placeholder="e.g. john@example.com"
                                        value={formEmail} onChange={e => setFormEmail(e.target.value)}
                                        className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Subject / Summary</label>
                                <input 
                                    type="text" required placeholder="Brief description of the issue"
                                    value={formSubject} onChange={e => setFormSubject(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Priority</label>
                                <select 
                                    value={formPriority} onChange={e => setFormPriority(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-bold"
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Issue details / notes</label>
                                <textarea 
                                    required rows={4} placeholder="Describe the customer inquiry or ticket details..."
                                    value={formMessage} onChange={e => setFormMessage(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl outline-none text-slate-900 dark:text-white transition-all font-semibold resize-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shadow-sm shadow-indigo-500/10">
                                    {isSubmitting ? 'Logging...' : 'Log Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
