import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/Utils/format';
import { ArrowLeft, Printer, PackageCheck, Receipt } from 'lucide-react';

export default function ReturnShow({ return: returnData, restockMovements = [] }) {
    const { store } = usePage().props;
    const creditNotePayment = (returnData?.payments || []).find(p => p.method === 'store_credit');
    const cashRefundPayment = (returnData?.payments || []).find(p => p.method === 'cash');

    return (
        <OneGlanceLayout title={`Return #${returnData?.reference_number || returnData?.id || ''}`} activeMenu="Sales">
            <Head title={`Return #${returnData?.reference_number || returnData?.id || ''}`} />

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
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Return #{returnData?.reference_number || returnData?.id}</h1>
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
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{returnData?.customer?.name || 'Walk-in Customer'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Amount</p>
                            <p className="text-2xl font-black text-red-600">{formatCurrency(Math.abs(returnData?.total || 0), store)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(returnData?.created_at, store)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Processed By</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{returnData?.user?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Refund Method</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white capitalize">{returnData?.payment_method || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Items Returned</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-2">Item</th>
                                <th className="py-2 text-center">Qty</th>
                                <th className="py-2 text-right">Unit Price</th>
                                <th className="py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {(returnData?.items || []).map((item, index) => (
                                <tr key={item.id || index}>
                                    <td className="py-3">
                                        <p className="font-bold text-slate-800 dark:text-white">{item.product?.name || 'Unknown Product'}</p>
                                        {item.variant && <p className="text-xs text-slate-500">Variant: {item.variant.sku}</p>}
                                    </td>
                                    <td className="py-3 text-center text-slate-600 dark:text-slate-300">{Math.abs(item.quantity)}</td>
                                    <td className="py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.unit_price, store)}</td>
                                    <td className="py-3 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(Math.abs(item.subtotal || item.net_amount || 0), store)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Restocked Batches */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <PackageCheck size={16} /> Stock Restocked
                    </h3>
                    {/* TODO: inventory_batches has no FK back to the originating return (no sale_id/
                        return_id column) — receiveBatch() creates a fresh batch untracked to the return.
                        The StockMovement ledger (type='return', reference_id=reference_number) is the
                        only reliable per-return audit trail, so we show quantity restocked per product
                        from there rather than the specific batch id. */}
                    {restockMovements.length === 0 ? (
                        <p className="text-sm text-slate-500">No stock movement records found for this return.</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-2">Product</th>
                                    <th className="py-2">Warehouse</th>
                                    <th className="py-2 text-right">Qty Restocked</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {restockMovements.map((mv) => (
                                    <tr key={mv.id}>
                                        <td className="py-3 font-medium text-slate-800 dark:text-white">{mv.product?.name || `Product #${mv.product_id}`}</td>
                                        <td className="py-3 text-sm text-slate-500">{mv.warehouse_id || '—'}</td>
                                        <td className="py-3 text-right font-medium text-emerald-600">+{mv.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Refund / Credit Note */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Receipt size={16} /> Refund
                    </h3>
                    {creditNotePayment ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Store Credit Issued</p>
                                <p className="text-xs text-slate-500">{creditNotePayment.reference || 'Credit note'} — {formatDate(creditNotePayment.date, store)}</p>
                            </div>
                            <p className="font-bold text-blue-600">{formatCurrency(Math.abs(creditNotePayment.amount), store)}</p>
                        </div>
                    ) : cashRefundPayment ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Cash Refund</p>
                                <p className="text-xs text-slate-500">{cashRefundPayment.reference || 'Cash refund'} — {formatDate(cashRefundPayment.date, store)}</p>
                            </div>
                            <p className="font-bold text-red-600">{formatCurrency(Math.abs(cashRefundPayment.amount), store)}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No refund payment record found for this return.</p>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
