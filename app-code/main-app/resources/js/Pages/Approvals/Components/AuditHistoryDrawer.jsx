import React, { useState } from 'react';
import { 
    X, 
    Clock, 
    User, 
    FileText, 
    CheckCircle2, 
    RotateCcw, 
    XCircle, 
    ArrowRight, 
    Calendar, 
    History,
    ShieldCheck,
    MessageSquare,
    AlertTriangle,
    Eye
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

export default function AuditHistoryDrawer({
    isOpen,
    onClose,
    document,
    store
}) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'revisions'
    const [selectedRevIndex, setSelectedRevIndex] = useState(0);

    const revisions = document.revisions || [];
    const transitions = document.transitions || [];

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderTransitionIcon = (toStatus) => {
        switch (toStatus) {
            case 'approved':
                return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'returned':
                return <RotateCcw size={14} className="text-amber-500" />;
            case 'rejected':
                return <XCircle size={14} className="text-rose-500" />;
            case 'pending':
                return <Clock size={14} className="text-blue-500" />;
            default:
                return <History size={14} className="text-ink-muted" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="relative w-full max-w-lg bg-surface border-l border-line shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
                {/* Drawer Header */}
                <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface/90">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-primary-600 dark:text-primary-400" />
                        <div>
                            <h2 className="text-sm font-bold text-ink">Audit & Review History</h2>
                            <p className="text-2xs text-ink-muted">Tracking all edits, transitions, and decisions</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tab switch */}
                <div className="px-5 pt-3 pb-2 border-b border-line flex items-center gap-2 bg-sunken/40">
                    <button
                        type="button"
                        onClick={() => setActiveTab('timeline')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            activeTab === 'timeline'
                                ? 'bg-surface text-ink shadow-xs border border-line font-bold'
                                : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                        Workflow Timeline ({transitions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('revisions')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            activeTab === 'revisions'
                                ? 'bg-surface text-ink shadow-xs border border-line font-bold'
                                : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                        Revisions ({revisions.length})
                    </button>
                </div>

                {/* Content body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Top Identity Block */}
                    <div className="p-3.5 rounded-xl bg-sunken/60 border border-line space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-ink-muted font-medium">Original Maker:</span>
                            <span className="font-semibold text-ink flex items-center gap-1.5">
                                <User size={13} className="text-primary-500" />
                                {document.maker?.name || 'Unknown'} ({document.maker?.email})
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-ink-muted font-medium">Submitted On:</span>
                            <span className="font-semibold text-ink tabular-nums">
                                {formatDateTime(document.created_at)}
                            </span>
                        </div>
                        {document.reviewer && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-line/60">
                                <span className="text-ink-muted font-medium">Assigned Reviewer:</span>
                                <span className="font-semibold text-ink flex items-center gap-1.5">
                                    <ShieldCheck size={13} className="text-emerald-500" />
                                    {document.reviewer.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Activity Log</h3>
                            {transitions.length === 0 ? (
                                <p className="text-xs text-ink-muted italic py-4 text-center">No transitions recorded yet.</p>
                            ) : (
                                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                                    {transitions.map((t, idx) => (
                                        <div key={t.id || idx} className="relative">
                                            {/* Dot icon */}
                                            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface border border-line flex items-center justify-center shadow-xs">
                                                {renderTransitionIcon(t.to_status)}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-ink capitalize">
                                                        {t.to_status === 'pending' ? 'Submitted for Review' : t.to_status}
                                                    </span>
                                                    <span className="text-3xs text-ink-muted tabular-nums">
                                                        {formatDateTime(t.created_at)}
                                                    </span>
                                                </div>

                                                <p className="text-2xs text-ink-muted">
                                                    By <strong className="text-ink">{t.actor?.name || 'System'}</strong>
                                                    {t.from_status && (
                                                        <span> (from <span className="capitalize">{t.from_status}</span>)</span>
                                                    )}
                                                </p>

                                                {t.reason_codes && t.reason_codes.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {t.reason_codes.map((rc, rci) => (
                                                            <span key={rci} className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                                {rc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {t.notes && (
                                                    <div className="mt-1.5 p-2 rounded-lg bg-sunken text-2xs text-ink border border-line flex items-start gap-1.5">
                                                        <MessageSquare size={12} className="text-ink-muted mt-0.5 shrink-0" />
                                                        <span className="italic">"{t.notes}"</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Revisions Tab */}
                    {activeTab === 'revisions' && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Stored Snapshots</h3>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {revisions.map((rev, rIndex) => (
                                    <button
                                        key={rev.id || rIndex}
                                        type="button"
                                        onClick={() => setSelectedRevIndex(rIndex)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                                            selectedRevIndex === rIndex
                                                ? 'bg-primary-500 text-white border-primary-600 shadow-xs'
                                                : 'bg-surface text-ink-muted border-line hover:text-ink hover:bg-interactive-hover'
                                        }`}
                                    >
                                        Revision #{rev.revision_number || rIndex + 1}
                                        {rIndex === revisions.length - 1 && ' (Current)'}
                                    </button>
                                ))}
                            </div>

                            {revisions[selectedRevIndex] && (
                                <div className="p-3 rounded-xl bg-sunken border border-line space-y-3 text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-line">
                                        <span className="text-ink-muted">Revision Created By:</span>
                                        <span className="font-semibold text-ink">
                                            {revisions[selectedRevIndex].maker?.name || 'Maker'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2 border-b border-line">
                                        <span className="text-ink-muted">Recorded Amount:</span>
                                        <span className="font-bold text-ink tabular-nums">
                                            {formatCurrency(revisions[selectedRevIndex].amount || 0, store)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2 border-b border-line">
                                        <span className="text-ink-muted">Timestamp:</span>
                                        <span className="font-medium text-ink tabular-nums">
                                            {formatDateTime(revisions[selectedRevIndex].created_at)}
                                        </span>
                                    </div>
                                    {revisions[selectedRevIndex].notes && (
                                        <div>
                                            <span className="text-2xs text-ink-muted block mb-1">Revision Notes:</span>
                                            <p className="p-2 rounded bg-surface border border-line text-2xs italic text-ink">
                                                {revisions[selectedRevIndex].notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Quick JSON summary */}
                                    <div>
                                        <span className="text-2xs text-ink-muted block mb-1">Payload Summary:</span>
                                        <pre className="p-2.5 rounded-lg bg-surface border border-line text-3xs font-mono text-ink overflow-x-auto max-h-56">
                                            {JSON.stringify(revisions[selectedRevIndex].payload, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Drawer Footer */}
                <div className="px-5 py-3 border-t border-line bg-surface flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sunken hover:bg-interactive-hover text-ink border border-line transition-colors"
                    >
                        Close History
                    </button>
                </div>
            </div>
        </div>
    );
}
