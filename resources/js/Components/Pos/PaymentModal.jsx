import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

const PaymentModal = ({ isOpen, onClose, totalAmount, onComplete, currency = 'PKR', bankAccounts = [], customer = null }) => {
    if (!isOpen) return null;

    const [payments, setPayments] = useState([{ 
        method: 'cash', 
        amount: '', 
        account_id: (bankAccounts.length > 0) ? bankAccounts[0].id : null 
    }]);
    const [notes, setNotes] = useState('');
    const [printReceipt, setPrintReceipt] = useState(true);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPayments([{ 
                method: 'cash', 
                amount: totalAmount, 
                account_id: (bankAccounts.length > 0) ? bankAccounts[0].id : null 
            }]);
            setNotes('');
        }
    }, [isOpen, totalAmount]);

    const paymentMethods = [
        { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
        { id: 'bank', name: 'Bank Transfer', icon: Smartphone, color: 'bg-indigo-500' },
        { id: 'card', name: 'Card', icon: CreditCard, color: 'bg-blue-500' },
        { id: 'upi', name: 'UPI / QR', icon: Smartphone, color: 'bg-purple-500' },
        { id: 'credit', name: 'Credit (Udhaar)', icon: CheckCircle, color: 'bg-amber-500' },
    ].filter(m => m.id !== 'credit' || customer !== null); // Filter out credit if no customer

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balance = totalPaid - totalAmount;
    const isFullyPaid = totalPaid >= totalAmount;
    const isCreditSale = payments.some(p => p.method === 'credit');

    const addPaymentMethod = () => {
        const remaining = Math.max(0, totalAmount - totalPaid);
        setPayments([...payments, { 
            method: 'cash', 
            amount: remaining > 0 ? remaining : '', 
            account_id: (bankAccounts.length > 0) ? bankAccounts[0].id : null 
        }]);
    };

    const removePaymentMethod = (index) => {
        const newPayments = payments.filter((_, i) => i !== index);
        setPayments(newPayments.length ? newPayments : [{ 
            method: 'cash', 
            amount: '', 
            account_id: (bankAccounts.length > 0) ? bankAccounts[0].id : null 
        }]);
    };

    const updatePayment = (index, field, value) => {
        const newPayments = [...payments];
        newPayments[index][field] = value;
        setPayments(newPayments);
    };

    const handleComplete = () => {
        // If credit sale, we allow "underpayment" (the rest is implicitly credit if not explicitly set, 
        // but here we want explicit credit entry for clarity, or we can auto-calculate).
        // For now, enforce total >= amount unless it's a credit sale where we might track the balance differently.
        // Actually, if "Credit" is a payment method, it counts towards the totalPaid.

        if (totalPaid < totalAmount && !isCreditSale) {
            // Allow proceeding but warn? Or block?
            // Usually POS blocks unless it's split with Credit.
            // If user wants to leave balance as credit, they should add a "Credit" payment line.
            alert("Total payment must equal or exceed the bill amount. Add a 'Credit' payment line for the balance.");
            return;
        }

        onComplete({
            payments: payments.map(p => ({ ...p, amount: parseFloat(p.amount) || 0 })),
            totalPaid,
            change: balance > 0 ? balance : 0,
            notes,
            printReceipt
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Complete Sale</h2>
                        <p className="text-sm text-slate-500">Select payment methods and finalize</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Total Amount Display */}
                    <div className="flex items-center justify-between mb-8 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                        <span className="text-lg font-medium text-indigo-900 dark:text-indigo-300">Total Payable</span>
                        <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Payment Methods List */}
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Payment Methods</label>
                            <button
                                onClick={addPaymentMethod}
                                className="text-xs flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                <Plus size={14} /> Split Payment
                            </button>
                        </div>

                        {payments.map((payment, index) => (
                            <div key={index} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-200">
                                <div className="flex-1">
                                    <div className="relative">
                                        <select
                                            value={payment.method}
                                            onChange={(e) => updatePayment(index, 'method', e.target.value)}
                                            className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 appearance-none font-medium text-slate-700 dark:text-slate-200"
                                        >
                                            {paymentMethods.map(method => (
                                                <option key={method.id} value={method.id}>{method.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            {(() => {
                                                const Icon = paymentMethods.find(m => m.id === payment.method)?.icon || Banknote;
                                                return <Icon size={18} />;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-[1.5]">
                                     <div className="relative">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</span>
                                         <input
                                             type="number"
                                             value={payment.amount}
                                             onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                                             placeholder="0.00"
                                             className="w-full h-12 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 font-bold text-lg text-right text-slate-800 dark:text-white"
                                             autoFocus={index === payments.length - 1}
                                             onFocus={(e) => e.target.select()}
                                         />
                                     </div>
                                     {['bank', 'card', 'online', 'upi'].includes(payment.method) && bankAccounts.length > 0 && (
                                         <div className="mt-1.5 animate-in slide-in-from-top-1 duration-200">
                                             <select 
                                                 value={payment.account_id || ''}
                                                 onChange={(e) => updatePayment(index, 'account_id', e.target.value)}
                                                 className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-lg py-1.5 px-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer"
                                             >
                                                 {bankAccounts.map(acc => (
                                                     <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                 ))}
                                             </select>
                                         </div>
                                     )}
                                 </div>
                                {payments.length > 1 && (
                                    <button
                                        onClick={() => removePaymentMethod(index)}
                                        className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary & Change */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500 font-medium uppercase">Total Paid</span>
                            <div className={`text-xl font-bold ${totalPaid < totalAmount ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {formatCurrency(totalPaid)}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500 font-medium uppercase">Change Due</span>
                            <div className="text-xl font-bold text-slate-800 dark:text-white">
                                {formatCurrency(balance > 0 ? balance : 0)}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Sale Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes for this sale..."
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 text-sm min-h-[80px] resize-none"
                        ></textarea>
                    </div>

                    {/* Print Toggle */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPrintReceipt(!printReceipt)}>
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${printReceipt ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {printReceipt && <CheckCircle size={16} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none flex items-center gap-2">
                            <Printer size={16} /> Print Receipt automatically
                        </span>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <button
                        onClick={handleComplete}
                        disabled={totalPaid < totalAmount && !isCreditSale}
                        className={`
                            w-full h-14 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${totalPaid < totalAmount && !isCreditSale
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/30 active:scale-[0.98]'
                            }
                        `}
                    >
                        <span>Complete Sale</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                            {formatCurrency(totalPaid > totalAmount ? totalAmount : totalPaid)}
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;
