import React from 'react';
import { 
    ArrowDownCircle, 
    ArrowUpCircle, 
    Receipt, 
    Banknote, 
    Building2, 
    CreditCard, 
    Smartphone, 
    FileText, 
    Calendar, 
    Phone, 
    Mail, 
    Hash, 
    CheckCircle2, 
    AlertCircle,
    User,
    Tag,
    Clock
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

export default function MoneyVoucherReviewView({
    document,
    payload,
    isEditing,
    onChangePayload,
    store,
    bankAccounts = [],
    expenseCategories = []
}) {
    const docType = document.document_type;
    const isIn = docType === 'customer_receipt' || docType === 'supplier_refund';
    const isExpense = docType === 'operating_expense';
    const isOut = !isIn && !isExpense;

    const handleFieldChange = (key, val) => {
        onChangePayload({
            ...payload,
            [key]: val,
            ...(key === 'amount' ? { grand_total: parseFloat(val) || 0, total_amount: parseFloat(val) || 0 } : {})
        });
    };

    const partyName = payload.party_name || payload.customer_name || payload.supplier_name || null;
    const partyPhone = payload.party_phone || payload.phone || null;
    const partyEmail = payload.party_email || payload.email || null;
    const partyType = payload.party_type || (isIn ? 'Customer' : 'Supplier');
    const currentBalance = parseFloat(payload.party_balance ?? 0);
    
    const amount = parseFloat(payload.amount ?? document.amount ?? 0);
    const balanceAfter = isIn ? currentBalance - amount : currentBalance - amount;

    const paymentMethod = (payload.payment_method || payload.method || 'cash').toLowerCase();
    const bankAccountName = payload.bank_account_name || payload.account_name || 'Cash in Hand (Till)';
    const chequeNumber = payload.cheque_number || payload.cheque_no || null;
    const chequeDate = payload.cheque_date || null;

    const expenseCategoryName = payload.expense_category_name || payload.category_name || 'General Expense';
    const allocations = payload.allocations || [];

    const METHODS = [
        { value: 'cash', label: 'Cash', icon: Banknote },
        { value: 'bank', label: 'Bank Transfer', icon: Building2 },
        { value: 'card', label: 'Card', icon: CreditCard },
        { value: 'upi', label: 'UPI / JazzCash', icon: Smartphone },
        { value: 'cheque', label: 'Cheque', icon: FileText },
    ];

    const getToneClasses = () => {
        if (isIn) {
            return {
                bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
                border: 'border-emerald-500/20 dark:border-emerald-800/40',
                badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
                text: 'text-emerald-600 dark:text-emerald-400',
                icon: <ArrowDownCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
                title: docType === 'supplier_refund' ? 'Supplier Refund (Money In)' : 'Customer Payment Received'
            };
        }
        if (isExpense) {
            return {
                bg: 'bg-indigo-500/10 dark:bg-indigo-950/30',
                border: 'border-indigo-500/20 dark:border-indigo-800/40',
                badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
                text: 'text-indigo-600 dark:text-indigo-400',
                icon: <Receipt size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />,
                title: 'Operating Expense Voucher'
            };
        }
        return {
            bg: 'bg-rose-500/10 dark:bg-rose-950/30',
            border: 'border-rose-500/20 dark:border-rose-800/40',
            badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
            text: 'text-rose-600 dark:text-rose-400',
            icon: <ArrowUpCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />,
            title: docType === 'customer_refund' ? 'Customer Refund (Money Out)' : 'Supplier Payment Made'
        };
    };

    const tone = getToneClasses();

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {/* Voucher Header Card */}
            <div className={`p-4 sm:p-5 rounded-2xl ${tone.bg} border ${tone.border} shadow-xs`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center shadow-xs">
                            {tone.icon}
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-ink">
                                {tone.title}
                            </h2>
                            <p className="text-2xs text-ink-muted flex items-center gap-2 mt-0.5">
                                <span className="font-mono">Ref: {payload.reference || document.document_number || 'N/A'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={11} />
                                    {payload.payment_date || payload.date || new Date(document.created_at).toLocaleDateString('en-PK')}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Prominent Amount Pill */}
                    <div className="text-right">
                        <span className="text-3xs uppercase font-bold text-ink-muted block">Transaction Amount</span>
                        {isEditing ? (
                            <input
                                type="number"
                                step="any"
                                value={amount}
                                onChange={(e) => handleFieldChange('amount', e.target.value)}
                                className="w-36 text-right px-2.5 py-1 text-base font-bold rounded-lg border border-line bg-surface text-ink tabular-nums font-mono shadow-xs"
                            />
                        ) : (
                            <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight block ${tone.text}`}>
                                {formatCurrency(amount, store)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Party or Category Section */}
            {!isExpense && partyName && (
                <div className="p-4 rounded-xl bg-surface border border-line shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sunken flex items-center justify-center font-bold text-ink text-sm border border-line shrink-0">
                                {partyName[0]?.toUpperCase() || 'P'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-ink">{partyName}</h3>
                                    <span className="text-3xs font-bold uppercase px-1.5 py-0.5 rounded bg-sunken text-ink-muted">
                                        {partyType}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-2xs text-ink-muted">
                                    {partyPhone && (
                                        <span className="flex items-center gap-1 font-mono">
                                            <Phone size={11} /> {partyPhone}
                                        </span>
                                    )}
                                    {partyEmail && (
                                        <span className="flex items-center gap-1">
                                            <Mail size={11} /> {partyEmail}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Balance Before & After */}
                        <div className="text-right text-xs">
                            <span className="text-3xs uppercase font-semibold text-ink-muted block">Party Position</span>
                            <span className="font-bold text-ink tabular-nums mt-0.5 block">
                                Balance: {formatCurrency(currentBalance, store)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {isExpense && (
                <div className="p-4 rounded-xl bg-surface border border-line shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20">
                            <Tag size={18} />
                        </div>
                        <div>
                            <span className="text-3xs uppercase font-semibold text-ink-muted block">Expense Category</span>
                            {isEditing ? (
                                <select
                                    value={payload.expense_category_id || ''}
                                    onChange={(e) => handleFieldChange('expense_category_id', e.target.value)}
                                    className="mt-1 px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink"
                                >
                                    <option value="">Select Category</option>
                                    {expenseCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <h3 className="text-sm font-bold text-ink">{expenseCategoryName}</h3>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Financial & Account Routing Details */}
            <div className="p-4 rounded-xl bg-surface border border-line shadow-xs space-y-4">
                <h3 className="text-3xs uppercase font-bold text-ink-muted tracking-wider">Payment Method & Routing</h3>
                
                {/* Method Pills */}
                {isEditing ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {METHODS.map(m => {
                            const Icon = m.icon;
                            const isSel = paymentMethod === m.value;
                            return (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => handleFieldChange('payment_method', m.value)}
                                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold border transition-colors ${
                                        isSel 
                                            ? 'bg-primary-500 text-white border-primary-600 shadow-xs' 
                                            : 'bg-surface text-ink border-line hover:bg-interactive-hover'
                                    }`}
                                >
                                    <Icon size={13} />
                                    <span>{m.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-sunken/60 border border-line">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Method</span>
                            <span className="font-bold text-ink capitalize flex items-center gap-1.5 mt-0.5">
                                <Banknote size={14} className="text-emerald-600" />
                                {paymentMethod}
                            </span>
                        </div>
                        <div className="p-3 rounded-lg bg-sunken/60 border border-line">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">
                                {isIn ? 'Deposited Into' : 'Paid Out Of'}
                            </span>
                            <span className="font-bold text-ink flex items-center gap-1.5 mt-0.5 truncate">
                                <Building2 size={14} className="text-primary-600 shrink-0" />
                                {bankAccountName}
                            </span>
                        </div>
                        <div className="p-3 rounded-lg bg-sunken/60 border border-line">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Voucher Reference</span>
                            <span className="font-mono font-bold text-ink mt-0.5 block truncate">
                                {payload.reference || '—'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Bank / Account selector if in edit mode */}
                {isEditing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                        <div>
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Target Account</span>
                            <select
                                value={payload.bank_account_id || payload.account_id || ''}
                                onChange={(e) => handleFieldChange('bank_account_id', e.target.value)}
                                className="w-full mt-1 px-2.5 py-1.5 text-xs rounded border border-line bg-surface text-ink"
                            >
                                <option value="">Default Cash Drawer / Till</option>
                                {bankAccounts.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.account_name} ({b.bank_name || 'Bank'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Reference Number</span>
                            <input
                                type="text"
                                value={payload.reference || ''}
                                onChange={(e) => handleFieldChange('reference', e.target.value)}
                                placeholder="Cheque / Trx ID / Voucher #"
                                className="w-full mt-1 px-2.5 py-1.5 text-xs rounded border border-line bg-surface text-ink font-mono"
                            />
                        </div>
                    </div>
                )}

                {/* Cheque specific details if cheque */}
                {(paymentMethod === 'cheque' || chequeNumber) && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                <FileText size={13} /> Reserved Cheque Leaf
                            </span>
                            <span className="font-mono font-bold text-amber-900 dark:text-amber-300">
                                Leaf #{chequeNumber || 'N/A'}
                            </span>
                        </div>
                        {chequeDate && (
                            <p className="text-2xs text-amber-800 dark:text-amber-400">
                                Cheque Maturity / Date: <strong className="font-mono">{chequeDate}</strong>
                            </p>
                        )}
                    </div>
                )}

                {/* Notes */}
                <div>
                    <span className="text-3xs font-semibold text-ink-muted uppercase block mb-1">Notes / Description</span>
                    {isEditing ? (
                        <textarea
                            value={payload.notes || payload.description || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            rows={2}
                            placeholder="Enter transaction notes..."
                            className="w-full p-2 text-xs rounded-lg border border-line bg-surface text-ink"
                        />
                    ) : (
                        <p className="p-2.5 rounded-lg bg-sunken/40 border border-line text-xs italic text-ink">
                            {payload.notes || payload.description || 'No additional notes provided.'}
                        </p>
                    )}
                </div>
            </div>

            {/* Allocations table if present */}
            {allocations.length > 0 && (
                <div className="rounded-xl bg-surface border border-line shadow-xs overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-line bg-sunken/40">
                        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Document Allocations</h4>
                    </div>
                    <table className="w-full text-xs text-left">
                        <thead className="bg-sunken/60 text-3xs uppercase font-bold text-ink-muted border-b border-line">
                            <tr>
                                <th className="px-4 py-2">Document #</th>
                                <th className="px-4 py-2 text-right">Settled Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {allocations.map((alloc, ai) => (
                                <tr key={ai} className="hover:bg-interactive-hover/40">
                                    <td className="px-4 py-2 font-mono font-semibold text-ink">
                                        {alloc.invoice_number || alloc.bill_number || `Doc #${alloc.sale_id || alloc.purchase_id}`}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums font-bold text-ink">
                                        {formatCurrency(alloc.amount || alloc.allocated_amount || 0, store)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
