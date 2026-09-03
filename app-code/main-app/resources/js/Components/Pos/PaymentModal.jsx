import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { usePage } from '@inertiajs/react';

const PaymentModal = ({
    isOpen, onClose, totalAmount, onComplete, currency = 'PKR', bankAccounts = [],
    customer = null, defaultPrintReceipt = true,
    /* A table splitting one bill between several people is not a different
       kind of sale -- it is this panel, which has always taken more than one
       tender. `seedSplit` only fills the amounts in, so "four ways" stops
       being arithmetic the waiter does on a napkin.
         { ways: n }    n equal rows
         { amount: x }  one row for x, the rest left to settle */
    seedSplit = null,
}) => {
    if (!isOpen) return null;

    const [payments, setPayments] = useState([
        {
            method: 'cash',
            amount: '',
            account_id: (bankAccounts.length > 0) ? bankAccounts[0].id : null
        },
        {
            method: 'bank',
            amount: '',
            account_id: (bankAccounts.length > 0) ? bankAccounts[0].id : null
        }
    ]);
    const [notes, setNotes] = useState('');
    const [printReceipt, setPrintReceipt] = useState(defaultPrintReceipt);
    const [activeMethodDropdownIndex, setActiveMethodDropdownIndex] = useState(null);
    const [activeAccountDropdownIndex, setActiveAccountDropdownIndex] = useState(null);


    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const acct = (bankAccounts.length > 0) ? bankAccounts[0].id : null;
            const blank = [
                { method: 'cash', amount: '', account_id: acct },
                { method: 'bank', amount: '', account_id: acct },
            ];

            if (seedSplit && seedSplit.ways > 1) {
                /* Equal shares that still add up. Dividing by n and rounding
                   every row leaves the last person paying a cent too much or
                   the till a cent short, so the remainder goes on the first
                   row rather than being scattered. */
                const n = Math.min(8, Math.max(2, Math.round(seedSplit.ways)));
                const each = Math.floor((totalAmount / n) * 100) / 100;
                const rows = Array.from({ length: n }, () => ({ method: 'cash', amount: each.toFixed(2), account_id: acct }));
                const drift = Math.round((totalAmount - each * n) * 100) / 100;
                if (drift) rows[0].amount = (each + drift).toFixed(2);
                setPayments(rows);
            } else if (seedSplit && seedSplit.amount > 0) {
                const first = Math.min(Number(seedSplit.amount), totalAmount);
                setPayments([
                    { method: 'cash', amount: first.toFixed(2), account_id: acct },
                    { method: 'card', amount: Math.max(0, totalAmount - first).toFixed(2), account_id: acct },
                ]);
            } else {
                setPayments(blank);
            }

            setNotes('');
            setPrintReceipt(defaultPrintReceipt);
        }
    }, [isOpen, totalAmount, defaultPrintReceipt, seedSplit]);

    const paymentMethods = [
        { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
        { id: 'bank', name: 'Bank Transfer', icon: Smartphone, color: 'bg-brand-500' },
        { id: 'card', name: 'Card', icon: CreditCard, color: 'bg-blue-500' },
        { id: 'upi', name: 'UPI / QR', icon: Smartphone, color: 'bg-brand-500' },
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
            printReceipt,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal">
            <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-line flex justify-between items-center bg-sunken/50 dark:bg-surface">
                    <div>
                        <h2 className="text-xl font-bold text-ink">Complete Sale</h2>
                        <p className="text-sm text-ink-muted">Select payment methods and finalize</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-full transition-colors">
                        <X size={20} className="text-ink-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Total Amount Display */}
                    <div className="flex items-center justify-between mb-8 bg-brand-50 dark:bg-brand-900/20 p-6 rounded-2xl border border-brand-100 dark:border-brand-500/30">
                        <span className="text-lg font-medium text-brand-900 dark:text-brand-300">Total Payable</span>
                        <span className="text-4xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Payment Methods List */}
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-ink-secondary uppercase tracking-wider">Payment Methods</label>
                            <button
                                onClick={addPaymentMethod}
                                className="text-xs flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 transition-colors"
                            >
                                <Plus size={14} /> Split Payment
                            </button>
                        </div>

                        {payments.map((payment, index) => (
                            <div key={index} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-normal">
                                <div className="flex-1">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setActiveMethodDropdownIndex(activeMethodDropdownIndex === index ? null : index)}
                                            className="w-full h-12 pl-10 pr-8 bg-app border border-line rounded-xl outline-none focus:ring-2 ring-brand-500/20 font-medium text-ink-secondary dark:text-ink flex items-center justify-between cursor-pointer"
                                        >
                                            <span className="truncate">
                                                {paymentMethods.find(m => m.id === payment.method)?.name || 'Method'}
                                            </span>
                                            <span className="text-ink-muted text-2xs">▼</span>
                                        </button>
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
                                            {(() => {
                                                const Icon = paymentMethods.find(m => m.id === payment.method)?.icon || Banknote;
                                                return <Icon size={18} />;
                                            })()}
                                        </div>

                                        {activeMethodDropdownIndex === index && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl shadow-2xl border border-line overflow-hidden z-drawer animate-in slide-in-from-top-2 duration-normal max-h-48 overflow-y-auto">
                                                {paymentMethods.map(method => (
                                                    <button
                                                        key={method.id}
                                                        type="button"
                                                        onClick={() => {
                                                            updatePayment(index, 'method', method.id);
                                                            setActiveMethodDropdownIndex(null);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${payment.method === method.id ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-ink-secondary'}`}
                                                    >
                                                        {method.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-[1.5]">
                                     <div className="relative">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-bold text-sm">
                                             {usePage().props.store?.currency_symbol || 'Rs'}
                                         </span>
                                         <input
                                             type="number"
                                             value={payment.amount}
                                             onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                                             placeholder="0.00"
                                             className="w-full h-12 pl-10 pr-4 bg-surface border border-line rounded-xl outline-none focus:ring-2 ring-brand-500/20 font-bold text-lg text-right text-ink"
                                             autoFocus={index === payments.length - 1}
                                             onFocus={(e) => e.target.select()}
                                         />
                                     </div>
                                     {['bank', 'card', 'online', 'upi'].includes(payment.method) && bankAccounts.length > 0 && (
                                         <div className="mt-1.5 animate-in slide-in-from-top-1 duration-normal relative">
                                             <button
                                                 type="button"
                                                 onClick={() => setActiveAccountDropdownIndex(activeAccountDropdownIndex === index ? null : index)}
                                                 className="w-full bg-sunken rounded-lg py-1.5 px-3 text-2xs font-bold text-ink-secondary focus:ring-1 focus:ring-brand-500/50 outline-none flex items-center justify-between cursor-pointer transition-all"
                                             >
                                                 <span>
                                                     {bankAccounts.find(acc => String(acc.id) === String(payment.account_id))?.name || bankAccounts[0]?.name || 'Select Account'}
                                                 </span>
                                                 <span className="text-ink-muted text-4xs ml-1">▼</span>
                                             </button>

                                             {activeAccountDropdownIndex === index && (
                                                 <div className="absolute top-full left-0 right-0 mt-0.5 bg-surface rounded-lg shadow-xl border border-line overflow-hidden z-drawer animate-in slide-in-from-top-1 duration-fast max-h-32 overflow-y-auto">
                                                     {bankAccounts.map(acc => (
                                                         <button
                                                             key={acc.id}
                                                             type="button"
                                                             onClick={() => {
                                                                 updatePayment(index, 'account_id', acc.id);
                                                                 setActiveAccountDropdownIndex(null);
                                                             }}
                                                             className={`w-full text-left px-3 py-2 text-2xs font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors ${String(payment.account_id) === String(acc.id) ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-ink-secondary'}`}
                                                         >
                                                             {acc.name}
                                                         </button>
                                                     ))}
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                                {payments.length > 1 && (
                                    <button
                                        onClick={() => removePaymentMethod(index)}
                                        className="h-12 w-12 flex items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary & Change */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-app rounded-xl border border-line">
                            <span className="text-xs text-ink-muted font-medium uppercase">Total Paid</span>
                            <div className={`text-xl font-bold ${totalPaid < totalAmount ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {formatCurrency(totalPaid)}
                            </div>
                        </div>
                        <div className="p-4 bg-app rounded-xl border border-line">
                            <span className="text-xs text-ink-muted font-medium uppercase">Change Due</span>
                            <div className="text-xl font-bold text-ink">
                                {formatCurrency(balance > 0 ? balance : 0)}
                            </div>
                        </div>
                    </div>



                    {/* Notes */}
                    <div className="mb-6">
                        <label className="text-sm font-bold text-ink-secondary uppercase tracking-wider mb-2 block">Sale Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes for this sale..."
                            className="w-full p-3 bg-app border border-line rounded-xl outline-none focus:ring-2 ring-brand-500/20 text-sm min-h-[80px] resize-none"
                        ></textarea>
                    </div>

                    {/* Print Toggle */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPrintReceipt(!printReceipt)}>
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${printReceipt ? 'bg-brand-600 border-brand-600' : 'border-line dark:border-line'}`}>
                            {printReceipt && <CheckCircle size={16} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium text-ink-secondary select-none flex items-center gap-2">
                            <Printer size={16} /> Print Receipt automatically
                        </span>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-line bg-sunken/50 dark:bg-surface">
                    <button
                        onClick={handleComplete}
                        disabled={totalPaid < totalAmount && !isCreditSale}
                        className={`
                            w-full h-14 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${totalPaid < totalAmount && !isCreditSale
                                ? 'bg-sunken text-ink-muted cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                            }
`}
                    >
                        <span>Complete Sale</span>
                        <span className="px-3 py-1.5 rounded-lg text-base font-bold bg-white/25 border border-white/20">
                            {formatCurrency(totalPaid > totalAmount ? totalAmount : totalPaid)}
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;
