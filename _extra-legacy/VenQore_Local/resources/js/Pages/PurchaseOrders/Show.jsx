import React from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PremiumButton from '@/Components/PremiumButton';
import { ShoppingCart, ArrowLeft, CheckCircle, Printer, Calendar, MapPin, Truck } from 'lucide-react';

export default function PurchaseOrdersShow({ order }) {
    const handleReceive = () => {
        if (confirm('Are you sure you want to mark this order as RECEIVED? This will update your inventory stock levels.')) {
            router.post(route('store.purchase-orders.receive', order.id));
        }
    };

    return (
        <OneGlanceLayout title={`PO: ${order.reference_number}`}>
            <Head title={`PO: ${order.reference_number}`} />

            <div className="p-6 h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <Link href={route('store.purchase-orders.index', { store_slug: store.slug })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-slate-500" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    {order.reference_number}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'received' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        order.status === 'ordered' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                        {order.status}
                                    </span>
                                </h2>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <Printer size={18} /> Print
                            </button>
                            {order.status !== 'received' && (
                                <Link
                                    href={route('store.purchase-orders.edit', order.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                    Edit Order
                                </Link>
                            )}
                            {order.status !== 'received' && (
                                <PremiumButton onClick={handleReceive}>
                                    <CheckCircle size={18} />
                                    Receive Stock
                                </PremiumButton>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
                            <Truck size={16} /> Supplier
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{order.supplier?.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{order.supplier?.contact_person}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{order.supplier?.email}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
                            <MapPin size={16} /> Destination
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{order.warehouse?.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{order.warehouse?.location}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">
                            <Calendar size={16} /> Dates
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">Ordered:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{new Date(order.order_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">Expected:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Ordered Qty</th>
                                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Received Qty</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Cost</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {order.items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{item.product?.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.product?.sku}</div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                        {parseFloat(item.quantity)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold ${parseFloat(item.received_quantity) >= parseFloat(item.quantity)
                                            ? 'text-green-600'
                                            : parseFloat(item.received_quantity) > 0
                                                ? 'text-amber-600'
                                                : 'text-slate-400'
                                            }`}>
                                            {parseFloat(item.received_quantity)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                                        ${parseFloat(item.unit_cost).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                        ${parseFloat(item.total_cost).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                            <tr>
                                <td colSpan="4" className="p-4 text-right font-bold text-slate-500 uppercase">Total Amount</td>
                                <td className="p-4 text-right font-bold text-xl text-slate-900 dark:text-white">
                                    ${parseFloat(order.total_amount).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {order.notes && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-sm">
                        <strong>Notes:</strong> {order.notes}
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
