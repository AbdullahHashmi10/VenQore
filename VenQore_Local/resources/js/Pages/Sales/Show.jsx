import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { ArrowLeft, Mail, Phone, MapPin, RotateCcw, X, Check, Wallet, CreditCard, Banknote } from 'lucide-react';
import axios from 'axios';
import SellModuleTabs from '@/Components/SellModuleTabs';
import { useAlert } from '@/Contexts/AlertContext';
import PrintButton from '@/Components/PrintButton';

export default function SalesShow({ sale, bankAccounts = [] }) {
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [refundMethod, setRefundMethod] = useState('cash'); // 'cash' or 'ledger'
    const [refundSource, setRefundSource] = useState('cash_drawer'); // 'cash_drawer', 'bank_account', 'online'
    const [selectedBankAccount, setSelectedBankAccount] = useState('');
    const { showAlert } = useAlert();
    const { store } = usePage().props;

    // Check if ?action=return is in URL - auto-open the return modal
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        // Only block if already returned, not for other statuses
        if (urlParams.get('action') === 'return') {
            if (sale.status === 'returned') {
                showAlert({
                    title: 'Already Returned',
                    message: 'This sale has already been returned.',
                    type: 'warning'
                });
            } else {
                setIsReturnModalOpen(true);
            }
        }
    }, []);

    // Initialize return form with all items, qty 0
    const { data, setData, post, processing, errors, reset } = useForm({
        items: sale.items.map(item => ({
            id: item.id,
            quantity: 0,
            max_quantity: item.quantity,
            name: item.product?.name || 'Unknown Product',
            price: item.unit_price
        })),
        refund_method: 'cash',
        refund_source: 'cash_drawer',
        bank_account_id: null
    });

    // Print handling is now done by PrintButton component

    const handleReturnSubmit = (e) => {
        e.preventDefault();
        // Filter out items with 0 quantity
        const itemsToReturn = data.items.filter(item => item.quantity > 0);

        if (itemsToReturn.length === 0) {
            showAlert({
                title: 'No Items Selected',
                message: 'Please select at least one item to return.',
                type: 'warning'
            });
            return;
        }

        post(route('store.sales.return', { store_slug: store?.slug, sale: sale.id }), {
            data: {
                items: itemsToReturn,
                refund_method: refundMethod,
                refund_source: refundSource,
                bank_account_id: refundSource === 'bank_account' ? selectedBankAccount : null
            },
            onSuccess: () => {
                setIsReturnModalOpen(false);
                reset();
            },
            onError: (errors) => {
                showAlert({
                    title: 'Return Failed',
                    message: errors.error || 'Something went wrong',
                    type: 'error'
                });
            }
        });
    };

    const handleSendEmail = async () => {
        const email = prompt("Enter customer email:", sale.customer?.email || "");
        if (!email) return;

        try {
            const response = await axios.post(route('store.sales.send-email', { store_slug: store?.slug, id: sale.id }), { email });
            if (response.data.success) {
                showAlert({ title: 'Success', message: 'Email sent successfully!', type: 'success' });
            }
        } catch (error) {
            showAlert({ title: 'Failed', message: 'Failed to send email: ' + (error.response?.data?.message || error.message), type: 'error' });
        }
    };

    const handleSendWhatsApp = async () => {
        const phone = prompt("Enter customer phone number:", sale.customer?.phone || "");
        if (!phone) return;

        try {
            const response = await axios.post(route('store.sales.send-whatsapp', { store_slug: store?.slug, id: sale.id }), { phone });
            if (response.data.success) {
                showAlert({ title: 'Success', message: 'WhatsApp message queued!', type: 'success' });
                if (response.data.mock_url) window.open(response.data.mock_url, '_blank');
            }
        } catch (error) {
            showAlert({ title: 'Failed', message: 'Failed to send WhatsApp: ' + (error.response?.data?.message || error.message), type: 'error' });
        }
    };

    const updateReturnQty = (index, qty) => {
        const newItems = [...data.items];
        // Ensure qty is between 0 and max
        const validQty = Math.max(0, Math.min(qty, newItems[index].max_quantity));
        newItems[index].quantity = validQty;
        setData('items', newItems);
    };

    // Calculate total refund amount based on selected quantities
    const refundTotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    // Check if customer is registered (has ID)
    const hasRegisteredCustomer = sale.customer && sale.customer.id;

    // Refund source options
    const refundSourceOptions = [
        { value: 'cash_drawer', label: 'Cash Drawer', icon: Banknote, color: 'emerald' },
        { value: 'bank_account', label: 'Bank Transfer', icon: CreditCard, color: 'blue' },
        { value: 'online', label: 'Online / Card', icon: Wallet, color: 'purple' }
    ];

    return (
        <OneGlanceLayout title={`Invoice #${sale.reference_number}`} activeMenu="Sell">
            <Head title={`Invoice #${sale.reference_number}`} />

            <div className="flex flex-col h-full">
                <SellModuleTabs activeTab="orders" />

                <div className="pb-8">
                    {/* Print Styles */}
                    <style>{`
                        @media print {
                            @page { margin: 0; }
                            body { -webkit-print-color-adjust: exact; }
                            nav, aside, header, .no-print { display: none !important; }
                            main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                            .print-container { padding: 40px !important; box-shadow: none !important; border: none !important; }
                        }
                    `}</style>

                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6 no-print">
                            <Link
                                href={route('store.sales.index', { store_slug: store?.slug })}
                                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                <ArrowLeft size={20} /> Back to Sales
                            </Link>
                            <div className="flex gap-3">
                                {sale.status === 'completed' && (
                                    <>
                                        <button
                                            onClick={handleSendEmail}
                                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 font-medium"
                                            title="Send via Email"
                                        >
                                            <Mail size={20} />
                                        </button>
                                        <button
                                            onClick={handleSendWhatsApp}
                                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95 font-medium"
                                            title="Send via WhatsApp"
                                        >
                                            <Phone size={20} />
                                        </button>
                                        <button
                                            onClick={() => setIsReturnModalOpen(true)}
                                            className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-xl transition-all active:scale-95 font-medium"
                                        >
                                            <RotateCcw size={20} /> Return Items
                                        </button>
                                    </>
                                )}
                                <PrintButton
                                    sale={sale}
                                    label="Print Invoice"
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-8 print-container">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                                            A
                                        </div>
                                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">VENQORE</h1>
                                    </div>
                                    <div className="text-sm text-slate-500 space-y-1">
                                        <p>123 Business Street</p>
                                        <p>City, Country 12345</p>
                                        <p>Phone: +1 234 567 890</p>
                                        <p>Email: info@venqorepos.com</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">INVOICE</h2>
                                    <p className="text-slate-500 font-medium">#{sale.reference_number}</p>
                                    <div className="mt-4 space-y-1 text-sm">
                                        <p className="text-slate-500">Date: <span className="text-slate-800 dark:text-slate-200 font-medium">{new Date(sale.created_at).toLocaleDateString()}</span></p>
                                        <p className="text-slate-500">Status: <span className="uppercase font-bold text-emerald-600">{sale.payment_status}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-8 mb-8 grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
                                    {sale.customer ? (
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-white text-lg">{sale.customer.name}</p>
                                            {sale.customer.email && (
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Mail size={14} /> {sale.customer.email}
                                                </p>
                                            )}
                                            {sale.customer.phone && (
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Phone size={14} /> {sale.customer.phone}
                                                </p>
                                            )}
                                            {sale.customer.address && (
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <MapPin size={14} /> {sale.customer.address}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">Walk-in Customer</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Details</h3>
                                    <p className="text-sm text-slate-500">Method: <span className="font-medium text-slate-800 dark:text-white capitalize">{sale.payment_method}</span></p>
                                    <p className="text-sm text-slate-500">Cashier: <span className="font-medium text-slate-800 dark:text-white">{sale.user?.name}</span></p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-8">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3">Item Description</th>
                                            <th className="py-3 text-center">Qty</th>
                                            <th className="py-3 text-right">Unit Price</th>
                                            <th className="py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sale.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-4">
                                                    <p className="font-bold text-slate-800 dark:text-white">{item.product.name}</p>
                                                    {item.variant && (
                                                        <p className="text-xs text-slate-500">Variant: {item.variant.sku}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                                <td className="py-4 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.unit_price)}</td>
                                                <td className="py-4 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-slate-500 text-sm">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(sale.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-sm">
                                        <span>Tax</span>
                                        <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(sale.tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-sm">
                                        <span>Discount</span>
                                        <span className="font-medium text-slate-800 dark:text-white">- {formatCurrency(sale.discount)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                                    <div className="flex justify-between text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        <span>Total</span>
                                        <span>{formatCurrency(sale.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 text-sm">
                                <p>Thank you for your business!</p>
                                <p className="mt-1 text-xs">For any inquiries, please contact us at support@venqorepos.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-red-500 to-rose-600">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <RotateCcw size={24} />
                                    </div>
                                    Process Return
                                </h3>
                                <button onClick={() => setIsReturnModalOpen(false)} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            {sale.customer && (
                                <p className="text-white/80 mt-2 text-sm">Customer: <span className="font-bold text-white">{sale.customer.name}</span></p>
                            )}
                        </div>

                        <form onSubmit={handleReturnSubmit} className="p-6 space-y-6">
                            {/* Items Selection */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Select Items to Return</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {data.items.map((item, index) => (
                                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.quantity > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500">Purchased: {item.max_quantity} × {formatCurrency(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateReturnQty(index, item.max_quantity)}
                                                    className="text-xs px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors font-bold"
                                                >
                                                    Return All
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.max_quantity}
                                                    value={item.quantity}
                                                    onChange={(e) => updateReturnQty(index, parseFloat(e.target.value) || 0)}
                                                    className="w-16 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold focus:ring-2 ring-red-500/30 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Refund Method Selection (WHERE money goes - for registered customers) */}
                            {refundTotal > 0 && hasRegisteredCustomer && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Where should the refund go?</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Cash Refund */}
                                        <button
                                            type="button"
                                            onClick={() => setRefundMethod('cash')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${refundMethod === 'cash'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                        >
                                            <Banknote size={28} className={refundMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'} />
                                            <span className={`font-bold text-sm ${refundMethod === 'cash' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>Cash Refund</span>
                                            <span className="text-xs text-slate-500">Pay customer now</span>
                                        </button>

                                        {/* Credit to Ledger/Khata */}
                                        <button
                                            type="button"
                                            onClick={() => setRefundMethod('ledger')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${refundMethod === 'ledger'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                        >
                                            <Wallet size={28} className={refundMethod === 'ledger' ? 'text-blue-600' : 'text-slate-400'} />
                                            <span className={`font-bold text-sm ${refundMethod === 'ledger' ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}>Credit to Khata</span>
                                            <span className="text-xs text-slate-500">Add to balance</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Refund Source Selection (WHERE money comes FROM - for cash refunds) */}
                            {refundTotal > 0 && refundMethod === 'cash' && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Refund From</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {refundSourceOptions.map(option => {
                                            const Icon = option.icon;
                                            const isSelected = refundSource === option.value;
                                            const colorClasses = {
                                                emerald: isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : '',
                                                blue: isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : '',
                                                purple: isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : ''
                                            };
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setRefundSource(option.value)}
                                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                                                        ? colorClasses[option.color]
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-400'
                                                        }`}
                                                >
                                                    <Icon size={22} />
                                                    <span className={`font-bold text-xs ${isSelected ? '' : 'text-slate-600 dark:text-slate-300'}`}>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Bank Account Dropdown (if bank transfer selected) */}
                                    {refundSource === 'bank_account' && bankAccounts.length > 0 && (
                                        <select
                                            value={selectedBankAccount}
                                            onChange={(e) => setSelectedBankAccount(e.target.value)}
                                            className="mt-3 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 ring-blue-500/20 outline-none"
                                        >
                                            <option value="">Select Bank Account</option>
                                            {bankAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Walk-in customer notice */}
                            {refundTotal > 0 && !hasRegisteredCustomer && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        <strong>Walk-in Customer:</strong> Refund will be given as cash only.
                                    </p>
                                </div>
                            )}

                            {/* Summary & Actions */}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-sm text-slate-500">Total Refund</p>
                                    <p className="text-2xl font-black text-red-600">{formatCurrency(refundTotal)}</p>
                                    {refundTotal > 0 && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {refundMethod === 'ledger' ? (
                                                <span>→ Credit to <span className="font-bold text-blue-600">Khata</span></span>
                                            ) : (
                                                <span>→ From <span className="font-bold uppercase">{refundSource.replace('_', ' ')}</span></span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsReturnModalOpen(false)}
                                        className="px-5 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || refundTotal === 0}
                                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-bold flex items-center gap-2 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Confirm Return
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
