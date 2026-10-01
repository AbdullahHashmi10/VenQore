import React from 'react';
import { Clock, Plus, List, ArrowRight, X } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';

export default function ApprovalSubmissionModal({
    isOpen,
    onClose,
    documentNumber = '',
    docLabel = 'Transaction',
    docPlural = '',
    listUrl = null,
    onCreateNew = null,
}) {
    const { store } = usePage().props;

    if (!isOpen) return null;

    const plural = docPlural || (docLabel.endsWith('s') ? docLabel : `${docLabel}s`);
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : 'default');

    const handleCreateNew = () => {
        if (onCreateNew) {
            onCreateNew();
        } else {
            router.reload({ preserveScroll: false });
        }
        onClose?.();
    };

    const handleGoToList = () => {
        onClose?.();
        if (listUrl) {
            router.visit(listUrl);
        } else {
            router.visit(`/s/${storeSlug}/approvals/my-submissions`);
        }
    };

    const handleGoToSubmissions = () => {
        onClose?.();
        router.visit(`/s/${storeSlug}/approvals/my-submissions`);
    };

    return (
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-fast"
            style={{
                background: 'rgba(8, 12, 11, 0.78)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div 
                className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-fast relative"
                style={{ borderRadius: 'var(--vq-radius-2xl, 32px)' }}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                {/* Glowing Status Icon */}
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                    <Clock size={32} className="animate-pulse" />
                </div>

                {/* Title & Ref */}
                <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-ink tracking-tight">
                        Submitted for Approval
                    </h3>
                    {documentNumber && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            {documentNumber.startsWith('#') ? documentNumber : `#${documentNumber}`}
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed px-2">
                    Your <strong>{docLabel}</strong> has been submitted to the approval queue. It will be posted to the live system once reviewed and approved by an authorized manager.
                </p>

                {/* Action Buttons */}
                <div className="w-full space-y-2.5 pt-2">
                    <button
                        type="button"
                        onClick={handleCreateNew}
                        className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        <span>Create Another {docLabel}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleGoToList}
                        className="w-full py-3 px-4 rounded-xl bg-app hover:bg-surface-sunken border border-line text-ink font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                        <List size={16} />
                        <span>View All {plural}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleGoToSubmissions}
                        className="w-full py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                    >
                        <span>Track in My Submissions</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}
