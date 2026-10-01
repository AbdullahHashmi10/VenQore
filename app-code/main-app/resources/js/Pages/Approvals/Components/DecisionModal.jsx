import React from 'react';
import { 
    X, 
    CheckCircle2, 
    RotateCcw, 
    XCircle, 
    Ban, 
    AlertTriangle, 
    MessageSquare,
    Check
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export default function DecisionModal({
    modalType,
    onClose,
    onConfirm,
    notes,
    setNotes,
    selectedReasonCode,
    setSelectedReasonCode,
    returnReasons = [],
    isSubmitting = false,
    document,
    store
}) {
    if (!modalType) return null;

    const amount = parseFloat(document.amount || 0);

    const getModalConfig = () => {
        switch (modalType) {
            case 'approve':
                return {
                    title: 'Approve & Post to Ledger',
                    description: 'This will post the transaction to the financial ledger and update stock/balances immediately.',
                    icon: <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />,
                    confirmText: 'Approve & Post Now',
                    confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                    notesRequired: false,
                    showReasons: false
                };
            case 'return':
                return {
                    title: 'Return Document for Correction',
                    description: 'The submission will be sent back to the maker. Please specify the reason and what needs to be fixed.',
                    icon: <RotateCcw size={24} className="text-amber-600 dark:text-amber-400" />,
                    confirmText: 'Return to Maker',
                    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
                    notesRequired: true,
                    showReasons: true
                };
            case 'reject':
                return {
                    title: 'Reject Document',
                    description: 'This document will be permanently rejected. Any reserved cheque leaves will be released.',
                    icon: <XCircle size={24} className="text-rose-600 dark:text-rose-400" />,
                    confirmText: 'Reject Document',
                    confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
                    notesRequired: false,
                    showReasons: true
                };
            case 'withdraw':
                return {
                    title: 'Withdraw Submission',
                    description: 'Are you sure you want to withdraw your submission from the review queue?',
                    icon: <Ban size={24} className="text-slate-600 dark:text-slate-400" />,
                    confirmText: 'Confirm Withdrawal',
                    confirmClass: 'bg-slate-700 hover:bg-slate-800 text-white',
                    notesRequired: false,
                    showReasons: false
                };
            default:
                return null;
        }
    };

    const config = getModalConfig();
    if (!config) return null;

    const isConfirmDisabled = isSubmitting || (config.notesRequired && !notes?.trim());

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-lg bg-surface rounded-2xl border border-line shadow-2xl p-6 z-10 space-y-4 animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sunken flex items-center justify-center shrink-0 border border-line">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-ink">{config.title}</h3>
                            <p className="text-2xs text-ink-muted mt-0.5">{config.description}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-ink-muted hover:text-ink w-8 h-8 rounded-lg flex items-center justify-center hover:bg-interactive-hover transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Amount preview pill */}
                <div className="p-3 rounded-xl bg-sunken/60 border border-line flex items-center justify-between text-xs">
                    <span className="text-ink-muted font-medium">Document Amount:</span>
                    <span className="font-bold text-ink tabular-nums text-sm">
                        {formatCurrency(amount, store)}
                    </span>
                </div>

                {/* Return/Reject Reasons Dropdown */}
                {config.showReasons && returnReasons.length > 0 && (
                    <div>
                        <label className="text-3xs font-bold uppercase text-ink-muted block mb-1">
                            Reason Category:
                        </label>
                        <select
                            value={selectedReasonCode}
                            onChange={(e) => setSelectedReasonCode(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-surface text-ink focus:ring-1 focus:ring-primary-500"
                        >
                            <option value="">Select a reason code...</option>
                            {returnReasons.map(r => (
                                <option key={r.code || r.id} value={r.code}>
                                    {r.title || r.name || r.code}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Reviewer / Maker Notes */}
                <div>
                    <label className="text-3xs font-bold uppercase text-ink-muted block mb-1">
                        {modalType === 'return' ? 'Required Instructions for Maker:' : 'Decision Notes (Optional):'}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder={modalType === 'return' ? "Explain what needs to be changed before re-submitting..." : "Add any decision remarks..."}
                        className="w-full p-2.5 text-xs rounded-lg border border-line bg-surface text-ink focus:ring-1 focus:ring-primary-500 placeholder:text-ink-muted/50"
                    />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isConfirmDisabled}
                        className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 ${config.confirmClass} ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                <Check size={14} />
                                <span>{config.confirmText}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
