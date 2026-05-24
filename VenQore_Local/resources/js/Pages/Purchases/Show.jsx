import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Printer,
    Download,
    Building2,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import PrintButton from '@/Components/PrintButton';

export default function Show({ purchase }) {
    const {
        store
    } = usePage().props;

    if (!purchase) return null;

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        received: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };

    return (
        <OneGlanceLayout title={`Purchase ${purchase.invoice_number}`} activeMenu="Purchase">
            <Head title={`Purchase ${purchase.invoice_number}`} />
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between no-print">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route("store.purchases.index", {
                                store_slug: store.slug
                            })}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                Purchase Bill #{purchase.invoice_number}
                            </h1>
                            <p className="text-sm text-slate-500">
                                Created on {new Date(purchase.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <PrintButton
                            sale={purchase}
                            label="Print"
                            variant="secondary"
                        />
                    </div>
                </div>

                {/* Invoice Document */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden print:shadow-none print:border-none">
                    {/* Invoice Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-1">PURCHASE BILL</h2>
                                <p className="text-slate-500 font-medium">#{purchase.invoice_number}</p>
                                <div className="mt-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[purchase.status] || 'bg-slate-100'}`}>
                                        {purchase.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-400 uppercase mb-1">Amount Due</p>
                                <p className="text-4xl font-black text-slate-800 dark:text-white">
                                    {(Number(purchase.total_amount) - Number(purchase.paid_amount || 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Total: {Number(purchase.total_amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 dark:border-slate-700">
                        {/* Supplier */}
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-4">Supplier Details</p>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Building2 size={20} className="text-indigo-500" />
                                    {purchase.party?.name || 'Unknown Supplier'}
                                </h3>
                                {purchase.party?.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Mail size={16} className="text-slate-400" />
                                        {purchase.party.email}
                                    </div>
                                )}
                                {purchase.party?.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Phone size={16} className="text-slate-400" />
                                        {purchase.party.phone}
                                    </div>
                                )}
                                {purchase.party?.address && (
                                    <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <MapPin size={16} className="text-slate-400 mt-0.5" />
                                        {purchase.party.address}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice Meta */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date Issued</p>
                                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Calendar size={16} className="text-indigo-500" />
                                    {new Date(purchase.date || purchase.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reference</p>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {purchase.reference || '-'}
                                </p>
                            </div>
                            {purchase.due_date && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Due Date</p>
                                    <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Clock size={16} className="text-rose-500" />
                                        {new Date(purchase.due_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-8">
                        <table className="w-full text-left">
                            <thead className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="pb-4 pl-2">Description</th>
                                    <th className="pb-4 text-right">Qty</th>
                                    <th className="pb-4 text-right">Unit Price</th>
                                    <th className="pb-4 text-right pr-2">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {purchase.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-4 pl-2">
                                            <p className="font-bold text-slate-800 dark:text-white truncate max-w-md">
                                                {item.product?.name || item.name || 'Item'}
                                            </p>
                                            <p className="text-xs text-slate-500">{item.product?.code}</p>
                                        </td>
                                        <td className="py-4 text-right font-medium text-slate-600 dark:text-slate-300">
                                            {item.quantity}
                                        </td>
                                        <td className="py-4 text-right font-medium text-slate-600 dark:text-slate-300">
                                            {Number(item.unit_price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="py-4 text-right font-bold text-slate-800 dark:text-white pr-2">
                                            {Number(item.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-slate-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan="3" className="pt-6 text-right font-bold text-slate-500 uppercase text-xs">Subtotal</td>
                                    <td className="pt-6 text-right font-bold text-slate-800 dark:text-white pr-2">
                                        {(Number(purchase.total_amount) - Number(purchase.tax) + Number(purchase.discount)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                                {Number(purchase.discount) > 0 && (
                                    <tr>
                                        <td colSpan="3" className="pt-2 text-right font-bold text-emerald-500 uppercase text-xs">Discount</td>
                                        <td className="pt-2 text-right font-bold text-emerald-500 pr-2">
                                            - {Number(purchase.discount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                    </tr>
                                )}
                                {Number(purchase.tax) > 0 && (
                                    <tr>
                                        <td colSpan="3" className="pt-2 text-right font-bold text-slate-500 uppercase text-xs">Tax</td>
                                        <td className="pt-2 text-right font-bold text-slate-800 dark:text-white pr-2">
                                            {Number(purchase.tax).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                    </tr>
                                )}
                                <tr>
                                    <td colSpan="3" className="pt-4 text-right font-black text-slate-800 dark:text-white text-lg">Total</td>
                                    <td className="pt-4 text-right font-black text-indigo-600 dark:text-indigo-400 text-lg pr-2">
                                        {Number(purchase.total_amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className="pt-2 text-right font-bold text-slate-500 text-sm">Amount Paid</td>
                                    <td className="pt-2 text-right font-bold text-slate-600 dark:text-slate-300 text-sm pr-2">
                                        {Number(purchase.paid_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes */}
                    {purchase.notes && (
                        <div className="p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Notes & Terms</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                {purchase.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
