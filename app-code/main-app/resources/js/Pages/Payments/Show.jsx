import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/Utils/format';
import { ArrowLeft, Printer, Banknote, CreditCard, Landmark, Wallet, Receipt } from 'lucide-react';

const methodIcon = (method) => {
    switch (method) {
        case 'cash': return Banknote;
        case 'bank': return Landmark;
        case 'card': return CreditCard;
        default: return Wallet;
    }
};

export default function PaymentShow({ payment, allocations = [] }) {
    const { store } = usePage().props;
    const isIn = payment?.type === 'in' || payment?.type === 'received';
    const MethodIcon = methodIcon(payment?.method);

    const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount || 0), 0);
    const unallocated = Math.max(0, parseFloat(payment?.amount || 0) - totalAllocated);

    return (
        <OneGlanceLayout title={`Payment #${payment?.id || ''}`} activeMenu="Finance">
            <Head title={`Payment #${payment?.id || ''}`} />

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
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payment #{payment?.reference || payment?.id}</h1>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 font-medium"
                    >
                        <Printer size={18} /> Print Receipt
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Party</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{payment?.party?.name || 'N/A'}</p>
                            {payment?.party?.type && (
                                <p className="text-xs text-slate-500 capitalize">{payment.party.type}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                            <p className={`text-2xl font-black ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isIn ? '+' : '-'} {formatCurrency(payment?.amount, store)}
                            </p>
                            <p className="text-xs font-bold uppercase text-slate-500">{isIn ? 'Payment In' : 'Payment Out'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(payment?.date, store)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Mode</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white capitalize flex items-center gap-1.5">
                                <MethodIcon size={14} className="text-slate-400" /> {payment?.method || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reference</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{payment?.reference || '—'}</p>
                        </div>
                    </div>

                    {payment?.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{payment.notes}</p>
                        </div>
                    )}

                    {payment?.bank_account && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Account</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{payment.bank_account.name}</p>
                        </div>
                    )}
                </div>

                {/* Allocations */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Receipt size={16} /> Applied To
                    </h3>

                    {allocations.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            This payment has not been allocated to any invoice yet — it is sitting as an unapplied credit/advance on the party's ledger.
                        </p>
                    ) : (
                        <>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="py-2">Invoice</th>
                                        <th className="py-2">Type</th>
                                        <th className="py-2 text-right">Amount Allocated</th>
                                        <th className="py-2 text-right">Link</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {allocations.map((alloc) => (
                                        <tr key={alloc.id}>
                                            <td className="py-3 font-medium text-slate-800 dark:text-white">
                                                {alloc.sale ? (alloc.sale.reference_number || alloc.sale.id) :
                                                 alloc.purchase ? (alloc.purchase.invoice_number || alloc.purchase.id) : '—'}
                                            </td>
                                            <td className="py-3 text-sm text-slate-500">
                                                {alloc.sale_id ? 'Sale' : alloc.purchase_id ? 'Purchase' : '—'}
                                            </td>
                                            <td className="py-3 text-right font-medium text-slate-800 dark:text-white">
                                                {formatCurrency(alloc.allocated_amount, store)}
                                            </td>
                                            <td className="py-3 text-right">
                                                {alloc.sale_id && (
                                                    <Link
                                                        href={route('store.sales.show', { store_slug: store?.slug, sale: alloc.sale_id })}
                                                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                                                    >
                                                        View Sale →
                                                    </Link>
                                                )}
                                                {alloc.purchase_id && !alloc.sale_id && (
                                                    <span className="text-xs text-slate-400">Purchase #{alloc.purchase_id}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end gap-8 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                                <div>
                                    <span className="text-slate-500">Total Allocated: </span>
                                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(totalAllocated, store)}</span>
                                </div>
                                {unallocated > 0.01 && (
                                    <div>
                                        <span className="text-slate-500">Unapplied: </span>
                                        <span className="font-bold text-amber-600">{formatCurrency(unallocated, store)}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
