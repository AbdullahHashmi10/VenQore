import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft, MessageSquare, Sparkles, Clock, Bot, User, Zap, AlertCircle, CheckCircle
} from 'lucide-react';
import VenaLogo from '@/Components/VenaLogo';

const ESCALATION_CONFIG = {
    ai_failure:        { label: 'AI Failure',         icon: Bot,          color: 'text-rose-500' },
    billing_or_complex:{ label: 'Billing / Complex',  icon: AlertCircle,  color: 'text-amber-500' },
    user_requested:    { label: 'User Requested',      icon: User,         color: 'text-blue-500' },
    repeated_failure:  { label: 'Repeated Failure',    icon: Zap,          color: 'text-orange-500' },
};

const STATUS_OPTIONS = [
    { value: 'open',        label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved',    label: 'Resolved' },
    { value: 'closed',      label: 'Closed' },
];

function parseChatTranscript(message) {
    // The transcript is stored as plain text lines in the ticket message body.
    // Format: "[2026-05-31 12:00:00] Bot: Hello...\n[2026-05-31 12:00:05] Visitor: ..."
    const transcriptStart = message.indexOf('--- CHAT TRANSCRIPT ---');
    if (transcriptStart === -1) {
        return { header: message, lines: [] };
    }
    const header = message.slice(0, transcriptStart).trim();
    const transcriptRaw = message.slice(transcriptStart + '--- CHAT TRANSCRIPT ---'.length).trim();
    const lines = transcriptRaw
        .split('\n')
        .filter(Boolean)
        .map((line) => {
            const match = line.match(/^\[([^\]]+)\]\s+(\w+):\s+(.+)$/);
            if (match) {
                return { time: match[1], sender: match[2], body: match[3] };
            }
            return { time: '', sender: '', body: line };
        });
    return { header, lines };
}

export default function VenaTicketDetail({ ticket, context }) {
    const { store } = usePage().props;
    const isPlatform = context === 'platform';
    const { header, lines } = parseChatTranscript(ticket.message || '');

    const escalationCfg = ESCALATION_CONFIG[ticket.escalation_type];

    const handleStatusChange = (newStatus) => {
        const routeName = isPlatform ? 'platform.vena.ticket.status' : 'store.admin.vena.ticket.status';
        const params = isPlatform
            ? { ticket: ticket.id }
            : { store_slug: store?.slug, ticket: ticket.id };
        router.post(route(routeName, params), { status: newStatus }, { preserveScroll: true });
    };

    const backRoute = isPlatform
        ? route('platform.vena.tickets')
        : route('store.admin.vena.tickets', { store_slug: store?.slug });

    return (
        <OneGlanceLayout mode="admin" title="Vena Ticket Detail" activeMenu="Vena Tickets">
            <Head title={`Ticket — ${ticket.subject}`} />

            <div className="h-full flex flex-col gap-4 overflow-hidden">
                {/* Back + header */}
                <div className="shrink-0 flex items-center gap-3">
                    <Link
                        href={backRoute}
                        className="w-9 h-9 rounded-xl border border-line bg-surface flex items-center justify-center text-ink-muted hover:text-ink-secondary dark:hover:text-white hover:border-line transition-all"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <VenaLogo size={18} />
                            <h1 className="text-base font-bold text-ink tracking-tight truncate">
                                {ticket.subject}
                            </h1>
                        </div>
                        <p className="text-1xs text-ink-muted">
                            From <strong className="text-ink-secondary">{ticket.requester_name}</strong>
                            {ticket.requester_email && <> · {ticket.requester_email}</>}
                            {ticket.tenant && isPlatform && <> · {ticket.tenant.name}</>}
                        </p>
                    </div>

                    {/* Status selector */}
                    <div className="flex items-center gap-2">
                        <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2 text-xs font-bold bg-surface border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-ink-secondary dark:text-ink cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    {/* Metadata card */}
                    <div className="bg-surface border border-line rounded-2xl p-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-3xs font-bold uppercase tracking-wider text-ink-muted mb-1">Session ID</div>
                                <div className="text-xs font-mono text-ink-secondary truncate">
                                    {header.match(/Session UUID:\s*([a-f0-9-]+)/i)?.[1]?.slice(0, 12) || '—'}…
                                </div>
                            </div>
                            <div>
                                <div className="text-3xs font-bold uppercase tracking-wider text-ink-muted mb-1">Escalation Reason</div>
                                <div className="flex items-center gap-1">
                                    {escalationCfg ? (
                                        <>
                                            <escalationCfg.icon size={12} className={escalationCfg.color} />
                                            <span className="text-xs font-bold text-ink-secondary">{escalationCfg.label}</span>
                                        </>
                                    ) : (
                                        <span className="text-xs text-ink-muted">—</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-3xs font-bold uppercase tracking-wider text-ink-muted mb-1">Priority</div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                    ticket.priority === 'high' ? 'text-rose-600 dark:text-rose-400' : 'text-ink-secondary'
                                }`}>
                                    {ticket.priority || 'Normal'}
                                </span>
                            </div>
                            <div>
                                <div className="text-3xs font-bold uppercase tracking-wider text-ink-muted mb-1">Created</div>
                                <div className="text-xs text-ink-secondary">
                                    {new Date(ticket.created_at).toLocaleString('en-GB', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat transcript */}
                    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-line">
                            <div className="w-7 h-7 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 flex items-center justify-center">
                                <MessageSquare size={13} className="text-brand-500 dark:text-brand-400" />
                            </div>
                            <h2 className="text-sm font-bold text-ink">Chat Transcript</h2>
                            <span className="text-2xs font-bold text-ink-muted ml-auto">{lines.length} messages</span>
                        </div>

                        <div className="p-5 space-y-3">
                            {lines.length === 0 ? (
                                <p className="text-xs text-ink-muted text-center py-8">No transcript available.</p>
                            ) : (
                                lines.map((line, i) => {
                                    const isVisitor = line.sender.toLowerCase() === 'visitor';
                                    const isBot = line.sender.toLowerCase() === 'bot';
                                    const isSystem = line.sender.toLowerCase() === 'system';

                                    if (isSystem) {
                                        return (
                                            <div key={i} className="flex justify-center">
                                                <span className="px-3 py-1 bg-sunken border border-line dark:border-line rounded-full text-3xs text-ink-muted font-bold uppercase tracking-wider text-center max-w-sm">
                                                    {line.body}
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={i} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                                                isVisitor
                                                    ? 'bg-brand-600 text-white rounded-tr-none'
                                                    : isBot
                                                        ? 'bg-sunken text-ink rounded-tl-none'
                                                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border border-emerald-100 dark:border-emerald-800 rounded-tl-none'
                                            }`}>
                                                <div className="text-3xs font-bold uppercase tracking-wider mb-0.5 opacity-60 flex items-center gap-1.5">
                                                    {isBot && <VenaLogo size={11} />}
                                                    {isBot ? 'Vena' : line.sender}
                                                    {line.time && <span className="ml-2 opacity-60 normal-case font-normal">{line.time.slice(11, 16)}</span>}
                                                </div>
                                                <p className="whitespace-pre-wrap leading-relaxed">{line.body}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-300)); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-700)); }
`}</style>
        </OneGlanceLayout>
    );
}
