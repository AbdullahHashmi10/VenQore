import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { SlidersHorizontal, CalendarDays, Hash, FileText, CheckCircle2, User } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { fireToast } from '@/lib/approval-response';
import axios from 'axios';

export default function PartyAdjustmentApprovalView({
    document = {},
    payload = {},
    isEditing = false,
    setIsEditing,
    notice,
    extraActions,
    canApprove = false,
    parties = [],
    storeSlug,
}) {
    const { store, settings } = usePage().props;
    const currency = getCurrencySymbol(store || settings);

    const [form, setForm] = useState({
        party_id: payload.party_id || payload.customer_id || payload.supplier_id || '',
        party_name: payload.party_name || payload.customer_name || payload.supplier_name || 'Party',
        type: payload.type || payload.adjustment_type || 'debit',
        amount: payload.amount || document.amount || '',
        date: payload.date || (document.created_at ? document.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        reason: payload.reason || payload.notes || '',
        description: payload.description || payload.notes || '',
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({
            party_id: payload.party_id || payload.customer_id || payload.supplier_id || '',
            party_name: payload.party_name || payload.customer_name || payload.supplier_name || 'Party',
            type: payload.type || payload.adjustment_type || 'debit',
            amount: payload.amount || document.amount || '',
            date: payload.date || (document.created_at ? document.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            reason: payload.reason || payload.notes || '',
            description: payload.description || payload.notes || '',
        });
    }, [payload, document]);

    const handleSaveAndApprove = (e) => {
        e?.preventDefault();
        setSaving(true);

        const updatedPayload = {
            ...payload,
            party_id: form.party_id,
            party_name: form.party_name,
            type: form.type,
            amount: parseFloat(form.amount || 0),
            date: form.date,
            reason: form.reason || form.description || null,
            description: form.description || form.reason || null,
            notes: form.description || form.reason || null,
        };

        axios.post(route('store.approvals.approve', { store_slug: storeSlug, id: document.id }), {
            notes: 'Approved with reviewer modifications',
            version: document.version,
            updated_payload: updatedPayload,
            updated_amount: parseFloat(form.amount || 0),
        })
        .then((res) => {
            fireToast(res.data?.message || 'Adjustment approved and posted successfully!', 'success');
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
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                <SlidersHorizontal size={22} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-ink">Party Balance Adjustment</h2>
                                <p className="text-xs text-ink-muted">Direct ledger debit/credit correction for party account</p>
                            </div>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sunken border border-line text-ink-muted">
                            #{document.document_number}
                        </span>
                    </div>

                    {/* Party Field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <User size={13} className="text-ink-muted" /> Party (Customer or Supplier)
                        </label>
                        {!isEditing ? (
                            <div className="p-3 bg-sunken rounded-xl border border-line font-semibold text-sm text-ink flex flex-wrap items-center justify-between gap-y-2">
                                <span>{form.party_name}</span>
                                {payload.party_balance !== undefined && (
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-secondary">
                                        Current: {formatCurrency(payload.party_balance, currency)}
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
                                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Adjustment Type & Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink">Adjustment Type</label>
                            {!isEditing ? (
                                <div className="p-3 bg-sunken rounded-xl border border-line font-bold text-xs uppercase tracking-wide text-ink">
                                    {form.type === 'debit' ? 'Debit (Increase Receivable / Reduce Payable)' : 'Credit (Increase Payable / Reduce Receivable)'}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, type: 'debit' }))}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                                            form.type === 'debit' ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-300' : 'bg-surface border-line text-ink-secondary hover:bg-interactive-hover'
                                        }`}
                                    >
                                        Debit (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, type: 'credit' }))}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                                            form.type === 'credit' ? 'bg-blue-500/10 border-blue-500 text-blue-800 dark:text-blue-300' : 'bg-surface border-line text-ink-secondary hover:bg-interactive-hover'
                                        }`}
                                    >
                                        Credit (-)
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-ink">Adjustment Amount ({currency})</label>
                            {!isEditing ? (
                                <div className="p-3 bg-sunken rounded-xl border border-line text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
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

                    {/* Date & Reason */}
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
                                <FileText size={13} className="text-ink-muted" /> Reason / Notes
                            </label>
                            {!isEditing ? (
                                <div className="p-2.5 bg-sunken rounded-xl border border-line text-xs text-ink min-h-[38px]">
                                    {form.description || form.reason || 'No reason provided'}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className="vqdoc-in w-full text-xs"
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value, reason: e.target.value }))}
                                    placeholder="Reason for adjustment"
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Adjustment Summary</h3>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                        <span className="text-xs font-semibold block opacity-80">Adjustment Size</span>
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
                            <span>Type</span>
                            <strong className="uppercase text-ink font-mono">{form.type}</strong>
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
                                {saving ? 'Saving...' : 'Save & Approve Adjustment'}
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
