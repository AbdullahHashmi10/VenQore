import React, { useEffect, useRef } from 'react';
import { Activity, ShoppingCart, ShoppingBag, Zap, X, ArrowRight, Plus } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function ActivityHubModal({
    isOpen,
    onClose,
    store,
    currentUrl = '',
    visibleInvoices = [],
    currentInvoiceId,
    onSelectInvoice,
    userPosSessions = [],
    currentPosId,
    onSelectPos,
    visiblePurchases = [],
    currentPurchaseId,
    onSelectPurchase,
    totalActiveOps = 0
}) {
    const modalRef = useRef(null);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="bg-surface rounded-2xl shadow-2xl border border-line dark:border-white/10 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-5 border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <Activity size={22} className={totalActiveOps > 0 ? "animate-pulse" : ""} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-ink">Activity Hub</h3>
                                {totalActiveOps > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        {totalActiveOps} Active
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-sunken text-ink-muted">
                                        Idle
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Real-time active sales, POS registers, and purchase orders
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-interactive-hover transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                    {/* Active Invoices */}
                    {visibleInvoices.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <ShoppingCart size={14} className="text-blue-500" />
                                    Active Sales Invoices ({visibleInvoices.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {visibleInvoices.map((inv, idx) => {
                                    const isCurrent = currentInvoiceId === inv.id && currentUrl.includes('/sales/invoice/create');
                                    return (
                                        <div
                                            key={inv.id}
                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                                isCurrent
                                                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                                    : 'bg-surface border-line hover:border-brand-200 dark:hover:border-brand-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-blue-400/50'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-ink">
                                                        {inv.customer?.name || `Invoice #${idx + 1}`}
                                                    </p>
                                                    <p className="text-2xs text-ink-muted">
                                                        Sale draft in progress
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onSelectInvoice(inv.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    isCurrent
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-interactive-hover hover:bg-brand-600 hover:text-white text-ink-secondary'
                                                }`}
                                            >
                                                {isCurrent ? 'Active Now' : 'Switch To'}
                                                {!isCurrent && <ArrowRight size={12} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Active POS Sessions */}
                    {userPosSessions.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Zap size={14} className="text-emerald-500" />
                                    Active POS Register Sessions ({userPosSessions.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {userPosSessions.map((pos, idx) => {
                                    const isCurrent = currentPosId === pos.id && currentUrl.startsWith('/pos');
                                    return (
                                        <div
                                            key={pos.id}
                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                                isCurrent
                                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-surface border-line hover:border-brand-200 dark:hover:border-brand-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20' : 'bg-emerald-400/50'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-ink">
                                                        {pos.customer?.name || `POS Session #${idx + 1}`}
                                                    </p>
                                                    <p className="text-2xs text-ink-muted">
                                                        Cashier checkout cart
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onSelectPos(pos.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    isCurrent
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-interactive-hover hover:bg-emerald-600 hover:text-white text-ink-secondary'
                                                }`}
                                            >
                                                {isCurrent ? 'Active Now' : 'Switch To'}
                                                {!isCurrent && <ArrowRight size={12} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Active Purchases */}
                    {visiblePurchases.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <ShoppingBag size={14} className="text-amber-500" />
                                    Active Purchases & Orders ({visiblePurchases.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {visiblePurchases.map((pur, idx) => {
                                    const isCurrent = currentPurchaseId === pur.id && currentUrl.includes('/purchases/create');
                                    return (
                                        <div
                                            key={pur.id}
                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                                isCurrent
                                                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                                                    : 'bg-surface border-line hover:border-brand-200 dark:hover:border-brand-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-amber-400/50'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-ink">
                                                        {pur.supplier?.name || `Purchase #${idx + 1}`}
                                                    </p>
                                                    <p className="text-2xs text-ink-muted">
                                                        Purchase order draft
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onSelectPurchase(pur.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                    isCurrent
                                                        ? 'bg-amber-600 text-white'
                                                        : 'bg-interactive-hover hover:bg-amber-600 hover:text-white text-ink-secondary'
                                                }`}
                                            >
                                                {isCurrent ? 'Active Now' : 'Switch To'}
                                                {!isCurrent && <ArrowRight size={12} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {totalActiveOps === 0 && (
                        <div className="py-8 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center mx-auto mb-3">
                                <Activity size={26} />
                            </div>
                            <h4 className="text-base font-bold text-ink">No Active Operations</h4>
                            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1 mb-6">
                                Multiple POS sessions, in-progress invoices, and purchase drafts will appear here so you can toggle between operations seamlessly.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {store && (
                                    <>
                                        <Link
                                            href={window.route('store.pos', { store_slug: store.slug })}
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Zap size={14} /> Open POS
                                        </Link>
                                        <Link
                                            href={window.route('store.sales.invoice.create', { store_slug: store.slug })}
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-surface border border-line hover:border-brand-300 text-ink transition-colors flex items-center gap-1.5 shadow-xs"
                                        >
                                            <Plus size={14} /> New Invoice
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-line bg-surface/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-ink-muted">
                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-sunken font-mono text-2xs">ESC</kbd> to close</span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg border border-line hover:bg-interactive-hover text-ink font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}