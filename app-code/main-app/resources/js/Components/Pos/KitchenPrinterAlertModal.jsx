import React, { useState, useEffect } from 'react';
import { AlertTriangle, Printer, RotateCcw, X } from 'lucide-react';

export default function KitchenPrinterAlertModal() {
    const [failedPrint, setFailedPrint] = useState(null);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail) {
                setFailedPrint(e.detail);
            }
        };

        window.addEventListener('kot:print-failed', handler);
        return () => window.removeEventListener('kot:print-failed', handler);
    }, []);

    if (!failedPrint) return null;

    const handleRetry = async () => {
        if (!failedPrint.retry) {
            setFailedPrint(null);
            return;
        }
        setRetrying(true);
        try {
            const res = await failedPrint.retry();
            if (res && res.success) {
                setFailedPrint(null);
            }
        } catch (err) {
            console.error('Retry failed:', err);
        } finally {
            setRetrying(false);
        }
    };

    const handleDismiss = () => {
        setFailedPrint(null);
    };

    const ticketNumber = failedPrint.kot?.order_number || failedPrint.kot?.ticket_id || 'Current';

    return (
        <div
            className="fixed inset-0 z-modal bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            role="alertdialog"
            aria-modal="true"
        >
            <div className="bg-surface border-2 border-red-500/80 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto ring-8 ring-red-500/10">
                    <Printer size={32} className="animate-pulse" />
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-ink text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                        <AlertTriangle size={20} />
                        Kitchen Ticket Failed to Print
                    </h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                        Ticket <b>#{ticketNumber}</b> was recorded, but the kitchen thermal printer failed to print. Check paper, cables, and power immediately so food gets prepared on time.
                    </p>
                    {failedPrint.error && (
                        <div className="bg-sunken rounded-lg p-2 text-2xs font-mono text-ink-muted text-left overflow-x-auto">
                            {failedPrint.error}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink-muted hover:text-ink hover:bg-interactive-hover text-xs font-bold transition-colors cursor-pointer"
                    >
                        Dismiss
                    </button>
                    <button
                        type="button"
                        onClick={handleRetry}
                        disabled={retrying}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <RotateCcw size={14} className={retrying ? 'animate-spin' : ''} />
                        {retrying ? 'Retrying...' : 'Retry Print'}
                    </button>
                </div>
            </div>
        </div>
    );
}
