import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { 
    Banknote, 
    Building2, 
    BookOpen, 
    CreditCard, 
    Smartphone, 
    CalendarDays, 
    Hash, 
    FileText, 
    User, 
    CheckCircle2, 
    RotateCcw, 
    XCircle, 
    Edit3, 
    X, 
    Layers, 
    ArrowDownCircle, 
    AlertTriangle 
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { fireToast } from '@/lib/approval-response';
import axios from 'axios';
import DocumentShell from '@/Documents/DocumentShell';
import useDocumentChrome from '@/Documents/useDocumentChrome';
import { documentType } from '@/Documents/documentTypes';

const METHODS = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'bank', label: 'Bank', icon: Building2 },
    { value: 'cheque', label: 'Cheque', icon: BookOpen },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI / Digital', icon: Smartphone },
];

export default function PaymentInApprovalView({
    document = {},
    payload = {},
    isEditing = false,
    setIsEditing,
    notice,
    extraActions,
    canApprove = false,
    parties = [],
    bankAccounts = [],
    storeSlug,
}) {
    const { store, settings } = usePage().props;
    const currency = getCurrencySymbol(store || settings);

    const [form, setForm] = useState({
        party_id: payload.party_id || payload.customer_id || payload.supplier_id || '',
        party_name: payload.party_name || payload.customer_name || payload.supplier_name || 'Party',
        amount: payload.amount || document.amount || '',
        date: payload.date || payload.payment_date || (document.created_at ? document.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        payment_method: payload.payment_method || 'cash',
        bank_account_id: payload.bank_account_id || payload.account_id || '',
        cheque_number: payload.cheque_number || '',
        bank_name: payload.bank_name || '',
        reference: payload.reference || document.document_number || '',
        description: payload.description || payload.notes || '',
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({
            party_id: payload.party_id || payload.customer_id || payload.supplier_id || '',
            party_name: payload.party_name || payload.customer_name || payload.supplier_name || 'Party',
            amount: payload.amount || document.amount || '',
            date: payload.date || payload.payment_date || (document.created_at ? document.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            payment_method: payload.payment_method || 'cash',
            bank_account_id: payload.bank_account_id || payload.account_id || '',
            cheque_number: payload.cheque_number || '',
            bank_name: payload.bank_name || '',
            reference: payload.reference || document.document_number || '',
            description: payload.description || payload.notes || '',
        });
    }, [payload, document]);

    const isCustomerReceipt = document.document_type === 'customer_receipt';
    const docTitle = isCustomerReceipt ? 'Customer Receipt (Money In)' : 'Supplier Refund (Money In)';

    const handleSaveAndApprove = (e) => {
        e?.preventDefault();
        setSaving(true);

        const updatedPayload = {
            ...payload,
            party_id: form.party_id,
            party_name: form.party_name,
            amount: parseFloat(form.amount || 0),
            date: form.date,
            payment_method: form.payment_method,
            bank_account_id: form.bank_account_id || null,
            cheque_number: form.cheque_number || null,
            bank_name: form.bank_name || null,
            reference: form.reference || null,
            description: form.description || null,
            notes: form.description || null,
        };

        axios.post(route('store.approvals.approve', { store_slug: storeSlug, id: document.id }), {
            notes: 'Approved with reviewer modifications',
            version: document.version,
            updated_payload: updatedPayload,
            updated_amount: parseFloat(form.amount || 0),
        })
        .then((res) => {
            fireToast(res.data?.message || 'Approved and posted successfully!', 'success');
            window.location.href = route('store.approvals.inbox', { store_slug: storeSlug });
        })
        .catch((err) => {
            const msg = err.response?.data?.message || 'Failed to save and approve';
            fireToast(msg, 'error');
            setSaving(false);
        });
    };

    return (
        <div className="vqdoc-scroll" style={{ padding: 'var(--d-margin)', display: 'flex', flexDirection: 'column', gap: 'var(--d-gutter)' }}>
            {notice}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto w-full">
                {/* Left: Main Details Form matching Payments/In.jsx */}
                <div className="lg:col-span-8 bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-line pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                                <ArrowDownCircle size={22} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-ink">{docTitle}</h2>
                                <p className="text-xs text-ink-muted">Record receipt of funds from party into account</p>
                            </div>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sunken border border-line text-ink-muted">
                            #{document.document_number}
                        </span>
                    </div>

                    {/* Party Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <User size={13} className="text-ink-muted" />
                            {isCustomerReceipt ? 'Customer' : 'Supplier'}
                        </label>
                        {!isEditing ? (
                            <div className="p-3 bg-sunken rounded-xl border border-line flex items-center justify-between">
                                <span className="font-semibold text-sm text-ink">{form.party_name}</span>
                                {payload.party_balance !== undefined && (
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-secondary">
                                        Current Balance: {formatCurrency(payload.party_balance, currency)}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <select
                                className="vqdoc-in w-full text-sm"
                                value={form.party_id}
                                onChange={(e) => {
                                    const p = parties.find(pt => String(pt.id) === String(e.target.value));
                                    setForm(prev => ({ ...prev, party_id: e.target.value, party_name: p?.name || prev.party_name }));
                                }}
                            >
                                <option value="">Select Party</option>
                                {parties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink">Received Amount ({currency})</label>
                            {!isEditing ? (
                                <div className="p-3 bg-sunken rounded-xl border border-line text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(form.amount, currency)}
                                </div>
                            ) : (
                                <input
                                    type="number"
                                    step="any"
                                    className="vqdoc-in w-full text-lg font-bold font-mono"
                                    value={form.amount}
                                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                />
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                                <CalendarDays size={13} className="text-ink-muted" /> Payment Date
                            </label>
                            {!isEditing ? (
                                <div className="p-3 bg-sunken rounded-xl border border-line text-sm font-semibold text-ink">
                                    {form.date}
                                </div>
                            ) : (
                                <input
                                    type="date"
                                    className="vqdoc-in w-full text-sm"
                                    value={form.date}
                                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                                />
                            )}
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-ink">Payment Method</label>
                        {!isEditing ? (
                            <div className="flex gap-2">
                                {METHODS.filter(m => m.value === form.payment_method).map(m => {
                                    const Icon = m.icon;
                                    return (
                                        <div key={m.value} className="px-3 py-2 rounded-xl bg-surface border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                                            <Icon size={15} /> {m.label}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {METHODS.map(m => {
                                    const Icon = m.icon;
                                    const active = form.payment_method === m.value;
                                    return (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, payment_method: m.value }))}
                                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                                                active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-surface border-line text-ink-secondary hover:bg-interactive-hover'
                                            }`}
                                        >
                                            <Icon size={16} />
                                            <span>{m.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bank Account / Cheque Fields */}
                    {form.payment_method !== 'cash' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-ink">Deposit Bank / Vault Account</label>
                                {!isEditing ? (
                                    <div className="p-2.5 bg-sunken rounded-xl border border-line text-xs font-medium text-ink">
                                        {payload.bank_account_name || bankAccounts.find(b => String(b.id) === String(form.bank_account_id))?.name || 'Main Bank Account'}
                                    </div>
                                ) : (
                                    <select
                                        className="vqdoc-in w-full text-xs"
                                        value={form.bank_account_id}
                                        onChange={(e) => setForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                                    >
                                        <option value="">Choose Bank Account</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} ({b.bank_name || 'Bank'})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {form.payment_method === 'cheque' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-ink">Cheque Number</label>
                                    {!isEditing ? (
                                        <div className="p-2.5 bg-sunken rounded-xl border border-line text-xs font-mono text-ink">
                                            {form.cheque_number || '—'}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="vqdoc-in w-full text-xs"
                                            value={form.cheque_number}
                                            onChange={(e) => setForm(prev => ({ ...prev, cheque_number: e.target.value }))}
                                            placeholder="Cheque No."
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reference & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                                <Hash size={13} className="text-ink-muted" /> Reference #
                            </label>
                            {!isEditing ? (
                                <div className="p-2.5 bg-sunken rounded-xl border border-line text-xs text-ink font-mono">
                                    {form.reference || 'Auto'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className="vqdoc-in w-full text-xs font-mono"
                                    value={form.reference}
                                    onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                                    placeholder="Reference"
                                />
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                                <FileText size={13} className="text-ink-muted" /> Description / Memo
                            </label>
                            {!isEditing ? (
                                <div className="p-2.5 bg-sunken rounded-xl border border-line text-xs text-ink min-h-[38px]">
                                    {form.description || 'No description provided'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className="vqdoc-in w-full text-xs"
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description / Memo"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Summary & Action Card */}
                <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Transaction Summary</h3>

                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                        <span className="text-xs font-semibold block opacity-80">Total Receipt</span>
                        <span className="text-2xl font-black font-mono tracking-tight mt-0.5 block">
                            {formatCurrency(form.amount || 0, currency)}
                        </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-line text-ink-secondary">
                            <span>Party</span>
                            <strong className="text-ink">{form.party_name}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-line text-ink-secondary">
                            <span>Method</span>
                            <strong className="capitalize text-ink">{form.payment_method}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-line text-ink-secondary">
                            <span>Date</span>
                            <strong className="text-ink">{form.date}</strong>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="pt-2 space-y-2">
                            <button
                                type="button"
                                onClick={handleSaveAndApprove}
                                disabled={saving}
                                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={15} />
                                {saving ? 'Saving...' : 'Save & Approve to Ledger'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="w-full py-2 rounded-xl text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover transition-colors cursor-pointer"
                            >
                                Cancel Edit
                            </button>
                        </div>
                    ) : (
                        <div className="pt-2 space-y-2">
                            {extraActions}
                            <button
                                type="button"
                                onClick={() => router.visit(route('store.approvals.inbox', { store_slug: storeSlug }))}
                                className="w-full py-2 rounded-xl text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
