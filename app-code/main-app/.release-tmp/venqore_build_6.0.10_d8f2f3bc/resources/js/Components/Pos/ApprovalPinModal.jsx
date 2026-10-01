import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import Modal from '@/Components/Modal';
import { approverOptions, describeApprovalLines } from '@/Domain/pos/approval';

/**
 * Manager approval for a POS sale the server refused with
 * code=approval_required (S-011 below cost / S-044 discount over limit).
 *
 * Pick an owner/admin/manager of this store, enter their PIN (not needed when
 * the approver is the signed-in user), and the parent resubmits the sale with
 * approved_by + approval_pin. If the server still refuses, the parent passes
 * the new `request` back in and its approval_error is shown here.
 *
 * Props:
 *   request   — parsed approval request (Domain/pos/approval.parseApprovalRequired).
 *               Render this only while a request is pending: {req && <ApprovalPinModal … />}
 *   storeSlug — current store slug (for GET /s/{slug}/sales/approvers)
 *   onSubmit  — async ({ approvedBy, pin }) => void
 *   onClose   — cancel
 *   busy      — the resubmission is in flight
 *   money     — optional amount formatter
 */
export default function ApprovalPinModal({ request, storeSlug, onSubmit, onClose, busy = false, money, zIndex = 'z-50' }) {
    const show = !!request;
    const [approvers, setApprovers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedId, setSelectedId] = useState('');
    // The PIN belongs to one server answer: a refused attempt (new `request`) starts it empty again.
    const [pinState, setPinState] = useState({ req: request, value: '' });
    const pin = pinState.req === request ? pinState.value : '';
    const setPin = (value) => setPinState({ req: request, value });

    // Mounted only while a request is pending (the parent renders it conditionally), so it loads once per request.
    useEffect(() => {
        let cancelled = false;
        axios.get(`/s/${storeSlug}/sales/approvers`)
            .then((res) => { if (!cancelled) setApprovers(res.data?.approvers || []); })
            .catch(() => { if (!cancelled) { setApprovers([]); setLoadError('Could not load approvers.'); } })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [storeSlug]);

    const options = useMemo(() => approverOptions(approvers, request), [approvers, request]);
    const selected = options.find((o) => o.user_id === selectedId) || null;
    const lines = describeApprovalLines(request, money);
    const canSubmit = !!selected && !selected.disabled && (!selected.needsPin || pin.length > 0) && !busy;

    const submit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ approvedBy: selected.user_id, pin: selected.needsPin ? pin : '' });
    };

    const title = request?.reasons?.includes('below_cost') && request?.reasons?.includes('discount_limit')
        ? 'Below cost and over discount limit'
        : request?.reasons?.includes('below_cost')
            ? 'Sale below cost'
            : request?.reasons?.includes('discount_limit')
                ? 'Discount over your limit'
                : 'Manager approval';

    return (
        <Modal show={show} onClose={busy ? () => {} : onClose} maxWidth="sm" zIndex={zIndex}>
            <form onSubmit={submit} className="p-6" data-testid="pos-approval-modal">
                <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-ink">{title}</h2>
                        <p className="text-sm text-ink-muted mt-1">A manager must approve this sale.</p>
                    </div>
                </div>

                {lines.length > 0 && (
                    <ul className="mb-4 space-y-1 text-sm text-ink-secondary">
                        {lines.map((text, i) => (
                            <li key={i} className="px-3 py-2 rounded-xl bg-sunken">{text}</li>
                        ))}
                    </ul>
                )}

                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Approved by</label>
                {loading ? (
                    <p className="text-sm text-ink-muted py-2">Loading approvers…</p>
                ) : options.length === 0 ? (
                    <p className="text-sm text-ink-muted py-2">{loadError || 'No owner, admin or manager in this store.'}</p>
                ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                        {options.map((o) => (
                            <button
                                key={o.user_id}
                                type="button"
                                disabled={!!o.disabled || busy}
                                onClick={() => { setSelectedId(o.user_id); setPin(''); }}
                                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedId === o.user_id
                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                    : 'border-line hover:border-brand-400'}`}
                            >
                                <span className="min-w-0">
                                    <span className="block font-bold text-sm text-ink truncate">{o.name}{o.is_self ? ' (you)' : ''}</span>
                                    <span className="block text-xs text-ink-muted capitalize">{o.role}</span>
                                </span>
                                {o.disabled && <span className="text-xs text-ink-muted shrink-0">{o.disabled}</span>}
                            </button>
                        ))}
                    </div>
                )}

                {selected?.needsPin && (
                    <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={20}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\s/g, ''))}
                        placeholder={`${selected.name}'s PIN`}
                        aria-label="Approver PIN"
                        className="w-full bg-app border border-line rounded-xl px-4 py-3 outline-none focus:ring-2 ring-brand-500 mb-4 text-ink tracking-widest"
                        autoFocus
                    />
                )}

                {request?.approvalError && (
                    <p className="text-sm font-bold text-red-500 mb-4" role="alert">{request.approvalError}</p>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 py-2.5 rounded-xl font-bold text-ink-secondary bg-sunken hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {busy ? 'Approving…' : 'Approve & complete'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
