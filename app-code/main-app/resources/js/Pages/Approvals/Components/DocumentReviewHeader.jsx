import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Clock, 
    CheckCircle2, 
    RotateCcw, 
    XCircle, 
    History, 
    Edit3, 
    Save, 
    X, 
    Ban, 
    Check, 
    Send,
    AlertCircle
} from 'lucide-react';

export default function DocumentReviewHeader({
    document,
    documentTitle,
    canApprove,
    isMaker,
    canWithdraw,
    canResubmit,
    isEditing,
    onToggleEdit,
    onDiscardEdit,
    onSaveAndApprove,
    onOpenDecisionModal,
    onToggleHistory,
    historyOpen,
    storeSlug,
    isSubmitting = false
}) {
    const revisionCount = document.revisions?.length || 1;

    const renderStatusBadge = () => {
        switch (document.status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock size={11} className="animate-spin-slow" /> Pending Review
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} /> Approved & Posted
                    </span>
                );
            case 'returned':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30">
                        <RotateCcw size={11} /> Needs Correction
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        <XCircle size={11} /> Rejected
                    </span>
                );
            case 'withdrawn':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sunken text-ink-muted border border-line">
                        <Ban size={11} /> Withdrawn
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sunken text-ink-muted">
                        {document.status}
                    </span>
                );
        }
    };

    const backUrl = isMaker 
        ? route('store.approvals.my-submissions', { store_slug: storeSlug })
        : route('store.approvals.inbox', { store_slug: storeSlug });

    return (
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line px-4 sm:px-6 py-2.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
                {/* Left: Back Link & Doc Identity */}
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-line hover:bg-interactive-hover text-ink transition-colors shrink-0"
                        title={isMaker ? "Back to My Submissions" : "Back to Reviewer Inbox"}
                    >
                        <ArrowLeft size={16} />
                    </Link>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-bold text-ink truncate">
                                {documentTitle}
                            </h1>
                            <span className="text-xs font-mono font-semibold text-ink-muted px-1.5 py-0.5 rounded bg-sunken">
                                #{document.document_number || `DOC-${document.id}`}
                            </span>
                            {renderStatusBadge()}
                        </div>
                        <p className="text-2xs text-ink-muted flex items-center gap-2 mt-0.5">
                            <span>Submitted by <strong className="text-ink font-semibold">{document.maker?.name || 'Maker'}</strong></span>
                            <span>•</span>
                            <span>{new Date(document.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                    </div>
                </div>

                {/* Right: Controls & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Audit History Drawer Toggle */}
                    <button
                        type="button"
                        onClick={onToggleHistory}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            historyOpen 
                                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/30' 
                                : 'bg-surface text-ink-muted hover:text-ink border-line hover:bg-interactive-hover'
                        }`}
                        title="View Audit Trail & Revisions"
                    >
                        <History size={14} />
                        <span className="hidden sm:inline">Audit & History</span>
                        <span className="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-sunken text-ink">
                            {revisionCount}
                        </span>
                    </button>

                    {/* Reviewer Actions when document is pending */}
                    {canApprove && (
                        <>
                            {isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={onDiscardEdit}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-line text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                                    >
                                        <X size={13} />
                                        <span>Discard</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onSaveAndApprove}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                                    >
                                        <Check size={14} />
                                        <span>{isSubmitting ? 'Posting...' : 'Save & Approve to Ledger'}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => onOpenDecisionModal('reject')}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-300/80 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                    >
                                        <XCircle size={13} />
                                        <span className="hidden sm:inline">Reject</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onOpenDecisionModal('return')}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                    >
                                        <RotateCcw size={13} />
                                        <span>Return to Maker</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onToggleEdit}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-indigo-300/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                    >
                                        <Edit3 size={13} />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onOpenDecisionModal('approve')}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>Approve & Post</span>
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {/* Maker Actions */}
                    {isMaker && (
                        <>
                            {canResubmit && (
                                <Link
                                    href={route('store.approvals.correct', { store_slug: storeSlug, id: document.id })}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                                >
                                    <Edit3 size={14} />
                                    <span>Edit & Resubmit</span>
                                </Link>
                            )}

                            {canWithdraw && (
                                <button
                                    type="button"
                                    onClick={() => onOpenDecisionModal('withdraw')}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-line text-ink-muted hover:text-rose-600 hover:bg-interactive-hover transition-colors"
                                >
                                    <Ban size={13} />
                                    <span>Withdraw</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Editing mode banner */}
            {isEditing && (
                <div className="max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-y-2 text-xs text-indigo-900 dark:text-indigo-300">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span><strong>In-Place Edit Active:</strong> You are adjusting document values. When done, click <strong>Save & Approve to Ledger</strong> to create an approval revision and post immediately.</span>
                    </div>
                </div>
            )}
        </header>
    );
}
