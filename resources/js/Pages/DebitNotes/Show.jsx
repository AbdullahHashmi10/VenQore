import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/Utils/format';
import { ArrowLeft, Printer, PackageMinus, FileWarning } from 'lucide-react';

export default function DebitNoteShow({ note, stockMovements = [] }) {
    const { store } = usePage().props;

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
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
                        <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Debit Note #{note?.reference_number || note?.id}</h1>
                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[note?.status] || 'bg-slate-100 text-slate-600'}`}>
                            {note?.status}
                        </span>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 font-medium"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>

                {/* Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{note?.supplier?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                            <p className="text-2xl font-black text-red-600">{formatCurrency(note?.amount, store)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(note?.date, store)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{note?.reason || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Linked Purchase Order</p>
                            {note?.purchase ? (
                                <Link
                                    href={route('store.purchase-orders.show', { store_slug: store?.slug, purchase_order: note.purchase_id })}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    {note.purchase.reference_number || `PO #${note.purchase_id}`} →
                                </Link>
                            ) : (
                                <p className="text-sm text-slate-500">Not linked to a purchase order</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Items</h3>
                    {(note?.items || []).length === 0 ? (
                        <p className="text-sm text-slate-500">No line items recorded — this note was created as a flat adjustment.</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-2">Product</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Unit Price</th>
                                    <th className="py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {note.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 font-medium text-slate-800 dark:text-white">{item.product?.name || `Product #${item.product_id}`}</td>
                                        <td className="py-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                        <td className="py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.unit_price, store)}</td>
                                        <td className="py-3 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(item.subtotal, store)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Stock Returned */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <PackageMinus size={16} /> Stock Returned to Supplier
                    </h3>
                    {stockMovements.length === 0 ? (
                        <p className="text-sm text-slate-500">No stock was deducted for this note (pending approval, or a flat financial adjustment with no inventory impact).</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-2">Product</th>
                                    <th className="py-2 text-right">Qty Removed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {stockMovements.map((mv) => (
                                    <tr key={mv.id}>
                                        <td className="py-3 font-medium text-slate-800 dark:text-white">{mv.product?.name || `Product #${mv.product_id}`}</td>
                                        <td className="py-3 text-right font-medium text-red-600">{mv.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* GL Posting */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
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
