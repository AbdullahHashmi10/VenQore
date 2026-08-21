import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/Utils/format';
import { ArrowLeft, Printer, PackageMinus, FileWarning, BadgeCheck } from 'lucide-react';

export default function DebitNoteShow({ note, stockMovements = [], bankAccounts = [] }) {
    const { store } = usePage().props;

    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundData, setRefundData] = useState({
        refund_method: 'cash',
        bank_account_id: bankAccounts[0]?.id || '',
        refund_date: new Date().toISOString().split('T')[0],
    });
    const [processingRefund, setProcessingRefund] = useState(false);

    const handleRefundSubmit = (e) => {
        e.preventDefault();
        setProcessingRefund(true);
        router.post(route('store.debit-notes.refund', { store_slug: store.slug, id: note.id }), refundData, {
            onSuccess: () => {
                setShowRefundForm(false);
                setProcessingRefund(false);
            },
            onError: () => {
                setProcessingRefund(false);
            }
        });
    };

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        applied: 'bg-neutral-100 text-ink-secondary dark:bg-app dark:text-ink-muted',
    };

    return (
        <OneGlanceLayout title={`Debit Note #${note?.reference_number || note?.id || ''}`} activeMenu="Finance">
            <Head title={`Debit Note #${note?.reference_number || note?.id || ''}`} />

            <style>{`
                @media print {
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                    nav, aside, header, .no-print { display: none !important; }
                    main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                }
`}</style>

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between no-print">
                    <div className="flex items-center gap-3">
                        <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="p-2 text-ink-muted hover:text-ink-secondary rounded-lg">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold text-ink">Debit Note #{note?.reference_number || note?.id}</h1>
                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[note?.status] || 'bg-sunken text-ink-secondary'}`}>
                            {note?.status}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {note?.status === 'approved' && (
                            <button
                                onClick={() => setShowRefundForm(!showRefundForm)}
                                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-all active:scale-95 font-medium"
                            >
                                <BadgeCheck size={18} /> Record Refund
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-surface text-ink-secondary dark:text-ink border border-line px-4 py-2 rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all active:scale-95 font-medium"
                        >
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                {showRefundForm && (
                    <div className="bg-surface rounded-2xl p-6 shadow-sm border border-brand-200 dark:border-brand-900 no-print">
                        <h3 className="text-sm font-bold text-ink mb-4">Record Cash/Bank Refund from Supplier</h3>
                        <form onSubmit={handleRefundSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Refund Method</label>
                                <select
                                    value={refundData.refund_method}
                                    onChange={(e) => setRefundData({ ...refundData, refund_method: e.target.value })}
                                    className="w-full rounded-xl border-line dark:bg-app text-ink text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank Account</option>
                                </select>
                            </div>
                            
                            {refundData.refund_method === 'bank' && (
                                <div>
                                    <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Bank Account</label>
                                    <select
                                        value={refundData.bank_account_id}
                                        onChange={(e) => setRefundData({ ...refundData, bank_account_id: e.target.value })}
                                        className="w-full rounded-xl border-line dark:bg-app text-ink text-sm"
                                    >
                                        {bankAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.account_number})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Refund Date</label>
                                <input
                                    type="date"
                                    value={refundData.refund_date}
                                    onChange={(e) => setRefundData({ ...refundData, refund_date: e.target.value })}
                                    className="w-full rounded-xl border-line dark:bg-app text-ink text-sm"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={processingRefund}
                                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-xl transition-all disabled:opacity-50 text-sm"
                                >
                                    {processingRefund ? 'Saving...' : 'Record Refund'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRefundForm(false)}
                                    className="bg-sunken hover:bg-interactive-hover text-ink-secondary font-medium py-2 px-4 rounded-xl transition-all text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Summary */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Supplier</p>
                            <p className="text-lg font-bold text-ink">{note?.supplier?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Amount</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(note?.amount, store)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-line">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Date</p>
                            <p className="text-sm font-medium text-ink">{formatDate(note?.date, store)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-sm font-medium text-ink">{note?.reason || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Linked Purchase Order</p>
                            {note?.purchase ? (
                                <Link
                                    href={route('store.purchase-orders.show', { store_slug: store?.slug, purchase_order: note.purchase_id })}
                                    className="text-sm font-medium text-brand-600 hover:text-brand-500"
                                >
                                    {note.purchase.reference_number || `PO #${note.purchase_id}`} →
                                </Link>
                            ) : (
                                <p className="text-sm text-ink-muted">Not linked to a purchase order</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-4">Items</h3>
                    {(note?.items || []).length === 0 ? (
                        <p className="text-sm text-ink-muted">No line items recorded — this note was created as a flat adjustment.</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider">
                                    <th className="py-2">Product</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Unit Price</th>
                                    <th className="py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {note.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 font-medium text-ink">{item.product?.name || `Product #${item.product_id}`}</td>
                                        <td className="py-3 text-center text-ink-secondary">{item.quantity}</td>
                                        <td className="py-3 text-right text-ink-secondary">{formatCurrency(item.unit_price, store)}</td>
                                        <td className="py-3 text-right font-medium text-ink">{formatCurrency(item.subtotal, store)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Stock Returned */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <PackageMinus size={16} /> Stock Returned to Supplier
                    </h3>
                    {stockMovements.length === 0 ? (
                        <p className="text-sm text-ink-muted">No stock was deducted for this note (pending approval, or a flat financial adjustment with no inventory impact).</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider">
                                    <th className="py-2">Product</th>
                                    <th className="py-2 text-right">Qty Removed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {stockMovements.map((mv) => (
                                    <tr key={mv.id}>
                                        <td className="py-3 font-medium text-ink">{mv.product?.name || `Product #${mv.product_id}`}</td>
                                        <td className="py-3 text-right font-medium text-red-600">{mv.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* GL Posting */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileWarning size={16} /> GL Posting
                    </h3>
                    {/* TODO: DebitNoteController::store() does not create a JournalEntry yet
                        (no journal_entry_id column on debit_notes, no reference_type='debit_note'
                        entries exist in the ledger). Flagging honestly instead of faking a posting. */}
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        This debit note has not been posted to the general ledger — no journal entry exists for it yet. Only the inventory-side stock return (above) is currently recorded.
                    </p>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
