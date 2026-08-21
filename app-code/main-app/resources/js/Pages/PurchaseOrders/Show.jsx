import React, { useState } from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PremiumButton from '@/Components/PremiumButton';
import { ShoppingCart, ArrowLeft, CheckCircle, Printer, Calendar, MapPin, Truck, Play } from 'lucide-react';

export default function PurchaseOrdersShow({ order }) {
    const { store } = usePage().props;
    const [isIntaking, setIsIntaking] = useState(false);
    const [intakeQuantities, setIntakeQuantities] = useState(
        order.items.reduce((acc, item) => {
            acc[item.id] = Math.max(0, parseFloat(item.quantity) - parseFloat(item.received_quantity || 0)).toString();
            return acc;
        }, {})
    );

    const handleReceive = () => {
        if (confirm('Are you sure you want to mark all remaining quantities as RECEIVED? This will update your inventory stock levels.')) {
            router.post(route('store.purchase-orders.receive', order.id));
        }
    };

    const handleIntakeSubmit = () => {
        const payload = {
            items: Object.entries(intakeQuantities).map(([id, receive_qty]) => ({
                id,
                receive_qty: parseFloat(receive_qty) || 0
            }))
        };
        router.post(route('store.purchase-orders.receive', order.id), payload, {
            onSuccess: () => {
                setIsIntaking(false);
            }
        });
    };

    return (
        <OneGlanceLayout title={`PO: ${order.reference_number}`}>
            <Head title={`PO: ${order.reference_number}`} />

            <div className="p-6 h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <Link href={route('store.purchase-orders.index', { store_slug: store.slug })} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-ink-muted" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-ink flex items-center gap-3">
                                    {order.reference_number}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'received' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        order.status === 'ordered' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-sunken text-ink-secondary dark:bg-raised dark:text-ink-secondary'
                                        }`}>
                                        {order.status}
                                    </span>
                                </h2>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-lg font-bold text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                <Printer size={18} /> Print
                            </button>
                            {order.status !== 'received' && !isIntaking && (
                                <Link
                                    href={route('store.purchase-orders.edit', order.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                    Edit Order
                                </Link>
                            )}
                            {order.status !== 'received' && !isIntaking && (
                                <button
                                    onClick={() => setIsIntaking(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                    Record Intake
                                </button>
                            )}
                            {order.status !== 'received' && !isIntaking && (
                                <PremiumButton onClick={handleReceive}>
                                    <CheckCircle size={18} />
                                    Receive All Remaining
                                </PremiumButton>
                            )}
                            {isIntaking && (
                                <button
                                    onClick={() => setIsIntaking(false)}
                                    className="px-4 py-2 bg-sunken text-ink-secondary border border-line rounded-lg font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            {isIntaking && (
                                <PremiumButton onClick={handleIntakeSubmit}>
                                    <CheckCircle size={18} />
                                    Save Stock Intake
                                </PremiumButton>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-surface p-6 rounded-xl border border-line">
                        <div className="flex items-center gap-3 mb-4 text-ink-muted font-bold text-sm uppercase tracking-wider">
                            <Truck size={16} /> Supplier
                        </div>
                        <p className="text-lg font-bold text-ink">{order.supplier?.name}</p>
                        <p className="text-ink-muted text-sm mt-1">{order.supplier?.contact_person}</p>
                        <p className="text-ink-muted text-sm">{order.supplier?.email}</p>
                    </div>

                    <div className="bg-surface p-6 rounded-xl border border-line">
                        <div className="flex items-center gap-3 mb-4 text-ink-muted font-bold text-sm uppercase tracking-wider">
                            <MapPin size={16} /> Destination
                        </div>
                        <p className="text-lg font-bold text-ink">{order.warehouse?.name}</p>
                        <p className="text-ink-muted text-sm mt-1">{order.warehouse?.location}</p>
                    </div>

                    <div className="bg-surface p-6 rounded-xl border border-line">
                        <div className="flex items-center gap-3 mb-4 text-ink-muted font-bold text-sm uppercase tracking-wider">
                            <Calendar size={16} /> Dates
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-ink-muted text-sm">Ordered:</span>
                                <span className="font-bold text-ink">{new Date(order.order_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-muted text-sm">Expected:</span>
                                <span className="font-bold text-ink">
                                    {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-surface rounded-xl border border-line overflow-hidden mb-8">
                    <table className="w-full">
                        <thead className="bg-app border-b border-line">
                            <tr>
                                <th className="p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Product</th>
                                <th className="p-4 text-center text-xs font-bold text-ink-muted uppercase tracking-wider">Ordered Qty</th>
                                <th className="p-4 text-center text-xs font-bold text-ink-muted uppercase tracking-wider">Received Qty</th>
                                {isIntaking && <th className="p-4 text-center text-xs font-bold text-brand-500 uppercase tracking-wider w-36">This Intake</th>}
                                <th className="p-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider">Unit Cost</th>
                                <th className="p-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {order.items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-4">
                                        <div className="font-bold text-ink">{item.product?.name}</div>
                                        <div className="text-xs text-ink-muted">SKU: {item.product?.sku}</div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-ink-secondary">
                                        {parseFloat(item.quantity)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold ${parseFloat(item.received_quantity) >= parseFloat(item.quantity)
                                            ? 'text-green-600'
                                            : parseFloat(item.received_quantity) > 0
                                                ? 'text-amber-600'
                                                : 'text-ink-muted'
                                            }`}>
                                            {parseFloat(item.received_quantity)}
                                        </span>
                                    </td>
                                    {isIntaking && (
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                max={parseFloat(item.quantity) - parseFloat(item.received_quantity || 0)}
                                                value={intakeQuantities[item.id] ?? ''}
                                                onChange={(e) => setIntakeQuantities({
                                                    ...intakeQuantities,
                                                    [item.id]: e.target.value
                                                })}
                                                className="w-24 text-center rounded-lg border-line dark:bg-app text-ink font-bold"
                                            />
                                        </td>
                                    )}
                                    <td className="p-4 text-right text-ink-secondary">
                                        ${parseFloat(item.unit_cost).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right font-bold text-ink">
                                        ${parseFloat(item.total_cost).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-app border-t border-line">
                            <tr>
                                <td colSpan={isIntaking ? 5 : 4} className="p-4 text-right font-bold text-ink-muted uppercase">Total Amount</td>
                                <td className="p-4 text-right font-bold text-xl text-ink">
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
