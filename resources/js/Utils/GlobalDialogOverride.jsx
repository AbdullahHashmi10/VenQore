/**
 * Global Dialog Override System
 * 
 * This module overrides native window.alert() and window.confirm() with 
 * custom styled modals for a consistent UI experience.
 * 
 * For confirm(), since native is synchronous but modals are async:
 * - We show the styled modal
 * - The original code patterns like `if (confirm('...'))` won't work directly
 * - Instead, calls to confirm() will show the modal, and we provide a callback system
 * 
 * For codebase-wide compatibility, pages should ideally use showConfirm from AlertContext,
 * but this override catches any legacy native calls and makes them look consistent.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

// Queue to handle multiple dialogs
let dialogQueue = [];
let currentResolver = null;
let setDialogExternal = null;

const GlobalDialogOverride = () => {
    const [dialog, setDialog] = useState(null);
    const resolveRef = useRef(null);

    // Make setDialog accessible externally
    useEffect(() => {
        setDialogExternal = setDialog;

        // Process any queued dialogs that happened before mounting
        if (dialogQueue.length > 0) {
            const next = dialogQueue.shift();
            showDialogInternal(next.type, next.message, next.title, next.resolve);
        }

        return () => {
            setDialogExternal = null;
        };
    }, []);

    const closeDialog = useCallback((result) => {
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
        setDialog(null);

        // Process next in queue
        if (dialogQueue.length > 0) {
            const next = dialogQueue.shift();
            setTimeout(() => {
                showDialogInternal(next.type, next.message, next.title, next.resolve);
            }, 100);
        }
    }, []);

    // Update resolveRef when dialog changes
    useEffect(() => {
        if (dialog && dialog.resolve) {
            resolveRef.current = dialog.resolve;
        }
    }, [dialog]);

    // Detect alert type based on message content
    const detectAlertType = (message) => {
        const msg = String(message || '').toLowerCase();
        if (msg.includes('error') || msg.includes('failed') || msg.includes('❌') || msg.includes('permanently')) {
            return 'error';
        }
        if (msg.includes('success') || msg.includes('✅') || msg.includes('recorded') || msg.includes('created') || msg.includes('deleted') || msg.includes('sent')) {
            return 'success';
        }
        if (msg.includes('warning') || msg.includes('sure') || msg.includes('confirm') || msg.includes('convert') || msg.includes('delete') || msg.includes('cancel') || msg.includes('discard')) {
            return 'warning';
        }
        return 'info';
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={48} className="text-emerald-500" />;
            case 'error': return <XCircle size={48} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={48} className="text-amber-500" />;
            default: return <Info size={48} className="text-brand-500" />;
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'success': return 'bg-emerald-100 dark:bg-emerald-900/30';
            case 'error': return 'bg-red-100 dark:bg-red-900/30';
            case 'warning': return 'bg-amber-100 dark:bg-amber-900/30';
            default: return 'bg-brand-100 dark:bg-brand-900/30';
        }
    };

    const getButtonClass = (type, isConfirm = false) => {
        if (isConfirm) {
            // For confirms, use warning/danger colors
            return 'bg-red-500 hover:bg-red-600 ';
        }
        switch (type) {
            case 'success': return 'bg-emerald-500 hover:bg-emerald-600 ';
            case 'error': return 'bg-red-500 hover:bg-red-600 ';
            case 'warning': return 'bg-amber-500 hover:bg-amber-600 ';
            default: return 'bg-brand-600 hover:bg-brand-700 ';
        }
    };

    // Keyboard handling
    useEffect(() => {
        if (!dialog) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeDialog(dialog.type === 'confirm' ? false : true);
            } else if (e.key === 'Enter') {
                closeDialog(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dialog, closeDialog]);

    if (!dialog) return null;

    const alertType = detectAlertType(dialog.message);

    return createPortal(
        <div className="fixed inset-0 z-command flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-fast"
                onClick={() => closeDialog(dialog.type === 'confirm' ? false : true)}
            />

            {/* Modal */}
            <div className="relative bg-surface rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-normal overflow-hidden border border-line">
                {/* Content */}
                <div className="flex flex-col items-center text-center p-6 pt-8">
                    {/* Icon */}
                    <div className={`mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-slow ${getIconBg(alertType)}`}>
                        {getIcon(alertType)}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-ink mb-2">
                        {dialog.title}
                    </h3>

                    {/* Message */}
                    <p className="text-ink-secondary mb-8 max-w-xs leading-relaxed text-sm">
                        {dialog.message}
                    </p>

                    {/* Buttons */}
                    <div className="flex w-full gap-3">
                        {dialog.type === 'confirm' && (
                            <button
                                onClick={() => closeDialog(false)}
                                className="flex-1 py-3 bg-sunken text-ink-secondary dark:text-ink font-bold rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={() => closeDialog(true)}
                            autoFocus
                            className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${getButtonClass(alertType, dialog.type === 'confirm')}`}
                        >
                            {dialog.type === 'confirm' ? 'Yes, Continue' : 'OK'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Internal function to show dialog
function showDialogInternal(type, message, title, resolve) {
    if (setDialogExternal) {
        setDialogExternal({
            type,
            message,
            title,
            resolve
        });
    }
}

// Initialize global overrides on module load
if (typeof window !== 'undefined') {
    // Store original implementations
    const nativeAlert = window.alert;
    const nativeConfirm = window.confirm;

    // Override alert
    window.alert = function (message) {
        return new Promise((resolve) => {
            if (setDialogExternal) {
                showDialogInternal('alert', message, 'Notice', resolve);
            } else {
                // Queue if component not yet mounted
                dialogQueue.push({ type: 'alert', message, title: 'Notice', resolve });
            }
        });
    };

    // Override confirm - This is tricky because native confirm is synchronous
    // We return a Promise, but existing code using `if (confirm(...))` needs refactoring
    // For now, we show the modal and return the promise
    window.confirm = function (message) {
        return new Promise((resolve) => {
            if (setDialogExternal) {
                showDialogInternal('confirm', message, 'Confirm', resolve);
            } else {
                // Queue if component not yet mounted
                dialogQueue.push({ type: 'confirm', message, title: 'Confirm', resolve });
            }
        });
    };

    // Store native versions for emergency fallback
    window._nativeAlert = nativeAlert;
    window._nativeConfirm = nativeConfirm;
}

export default GlobalDialogOverride;
