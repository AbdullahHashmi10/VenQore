import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Landmark, CalendarDays, Hash, FileText, CheckCircle2, User, Building2 } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { fireToast } from '@/lib/approval-response';
import axios from 'axios';

export default function FundMovementApprovalView({
    document = {},
    payload = {},
    isEditing = false,
    setIsEditing,
    notice,
    extraActions,
    canApprove = false,
    bankAccounts = [],
    storeSlug,
}) {
    const { store, settings } = usePage().props;
    const currency = getCurrencySymbol(store || settings);

    const isCapital = document.document_type === 'capital_injection';
    const docTitle = isCapital ? 'Owner Capital Addition' : 'Owner Drawing / Withdrawal';

    const [form, setForm] = useState({
        partner_name: payload.partner_name || payload.owner_name || payload.party_name || 'Owner / Partner',
        bank_account_id: payload.bank_account_id || payload.account_id || '',
        bank_account_name: payload.bank_account_name || 'Main Account',
        amount: payload.amount || document.amount || '',
        date: payload.date || (document.created_at ? document.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        reference: payload.reference || document.document_number || '',
        description: payload.description || payload.notes || '',
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({
            partner_name: payload.partner_name || payload.owner_name || payload.party_name || 'Owner / Partner',
            bank_account_id: payload.bank_account_id || payload.account_id || '',
            bank_account_name: payload.bank_account_name || 'Main Account',
            amount: payload.amount || document.amount || '',
            date: payload.date || (document.created_at ? document.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            reference: payload.reference || document.document_number || '',
            description: payload.description || payload.notes || '',
        });
    }, [payload, document]);

    const handleSaveAndApprove = (e) => {
        e?.preventDefault();
        setSaving(true);

        const updatedPayload = {
            ...payload,
            partner_name: form.partner_name,
            bank_account_id: form.bank_account_id || null,
            amount: parseFloat(form.amount || 0),
            date: form.date,
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
                <div className="lg:col-span-8 bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-line pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                isCapital ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                                <Landmark size={22} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-ink">{docTitle}</h2>
                                <p className="text-xs text-ink-muted">
                                    {isCapital ? 'Add equity funds from owner/partner into business' : 'Withdraw funds by owner/partner for personal use'}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sunken border border-line text-ink-muted">
                            #{document.document_number}
                        </span>
                    </div>

                    {/* Partner Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <User size={13} className="text-ink-muted" /> Owner / Partner Name
                        </label>
                        {!isEditing ? (
                            <div className="p-3 bg-sunken rounded-xl border border-line font-semibold text-sm text-ink">
                                {form.partner_name}
                            </div>
                        ) : (
                            <input
                                type="text"
                                className="vqdoc-in w-full text-sm font-semibold"
                                value={form.partner_name}
                                onChange={(e) => setForm(prev => ({ ...prev, partner_name: e.target.value }))}
                                placeholder="Partner / Investor Name"
                            />
                        )}
                    </div>

                    {/* Account and Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                                <Building2 size={13} className="text-ink-muted" />
                                {isCapital ? 'Destination Bank / Cash Account' : 'Source Bank / Cash Account'}
                            </label>
                            {!isEditing ? (
                                <div className="p-3 bg-sunken rounded-xl border border-line font-medium text-xs text-ink">
                                    {form.bank_account_name || bankAccounts.find(b => String(b.id) === String(form.bank_account_id))?.name || 'Main Account'}
                                </div>
                            ) : (
                                <select
                                    className="vqdoc-in w-full text-xs"
                                    value={form.bank_account_id}
                                    onChange={(e) => setForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                                >
                                    <option value="">Choose Account</option>
                                    {bankAccounts.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({formatCurrency(b.current_balance, currency)})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink">Amount ({currency})</label>
                            {!isEditing ? (
                                <div className={`p-3 bg-sunken rounded-xl border border-line text-xl font-bold font-mono ${
                                    isCapital ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>
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
                    </div>

                    {/* Date & Reference */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                                <CalendarDays size={13} className="text-ink-muted" /> Date
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
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <FileText size={13} className="text-ink-muted" /> Description / Notes
                        </label>
                        {!isEditing ? (
                            <div className="p-2.5 bg-sunken rounded-xl border border-line text-xs text-ink min-h-[38px]">
                                {form.description || 'No notes provided'}
                            </div>
                        ) : (
                            <input
                                type="text"
                                className="vqdoc-in w-full text-xs"
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Purpose or Description"
                            />
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Movement Summary</h3>

                    <div className={`p-4 rounded-xl border ${
                        isCapital ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                    }`}>
                        <span className="text-xs font-semibold block opacity-80">{isCapital ? 'Capital Added' : 'Drawing Amount'}</span>
                        <span className="text-2xl font-black font-mono tracking-tight mt-0.5 block">
                            {formatCurrency(form.amount || 0, currency)}
                        </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-line text-ink-secondary">
                            <span>Partner</span>
                            <strong className="text-ink">{form.partner_name}</strong>
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
                                {saving ? 'Saving...' : 'Save & Approve Movement'}
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
