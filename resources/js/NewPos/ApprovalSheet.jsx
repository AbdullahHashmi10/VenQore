/**
 * Manager approval sheet for NewPos (S-011 below cost / S-044 discount over
 * limit). Shown when POST /sales answers 422 code=approval_required: pick an
 * owner/admin/manager of this store, enter their PIN (not needed when the
 * approver is the signed-in user), and NewPos resubmits the same sale with
 * approved_by + approval_pin. The classic POS uses Components/Pos/ApprovalPinModal;
 * both share the pure helpers in Domain/pos/approval. Render it only while a
 * request is pending ({req && <ApprovalSheet … />}) so each request starts fresh.
 */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Sheet, n0 } from '@/LayoutLaw/ui';
import { approverOptions, describeApprovalLines } from '@/Domain/pos/approval';

export default function ApprovalSheet({ request, storeSlug, onSubmit, onClose, busy = false, narrow }) {
    const open = !!request;
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
    const lines = describeApprovalLines(request, (v) => `PKR ${n0(v)}`);
    const canSubmit = !!selected && !selected.disabled && (!selected.needsPin || pin.length > 0) && !busy;

    const submit = () => {
        if (canSubmit) onSubmit({ approvedBy: selected.user_id, pin: selected.needsPin ? pin : '' });
    };

    return (
        <Sheet
            open={open}
            onClose={busy ? () => {} : onClose}
            title="Manager approval"
            subtitle={request?.reasons?.includes('below_cost') ? 'Sale below cost' : 'Discount over your limit'}
            size={narrow ? 'bottom' : 'side'}
            footer={(
                <div className="nqp-actions">
                    <button type="button" className="nqp-cta" data-ghost="true" disabled={busy} onClick={onClose}>Cancel</button>
                    <button type="button" className="nqp-cta" disabled={!canSubmit} onClick={submit}>
                        {busy ? 'Approving…' : 'Approve & complete'}
                    </button>
                </div>
            )}
        >
            {lines.map((text, i) => (
                <div key={i} className="nqp-row" data-static="true">
                    <span className="nqp-rowmain"><span className="nqp-line-sub">{text}</span></span>
                </div>
            ))}

            {loading && <div className="nqp-row" data-static="true"><span className="nqp-line-sub">Loading approvers…</span></div>}
            {!loading && options.length === 0 && (
                <div className="nqp-row" data-static="true">
                    <span className="nqp-line-sub">{loadError || 'No owner, admin or manager in this store.'}</span>
                </div>
            )}
            {!loading && options.map((o) => (
                <button
                    key={o.user_id}
                    type="button"
                    className="nqp-row"
                    aria-pressed={selectedId === o.user_id}
                    disabled={!!o.disabled || busy}
                    onClick={() => { setSelectedId(o.user_id); setPin(''); }}
                    style={selectedId === o.user_id ? { background: 'var(--vq-surface-2)', boxShadow: 'inset 3px 0 0 var(--vq-accent-fill)' } : undefined}
                >
                    <span className="nqp-rowmain">
                        <span className="nqp-rowtitle">{o.name}{o.is_self ? ' (you)' : ''}</span>
                        <span className="nqp-line-sub" style={{ textTransform: 'capitalize' }}>{o.disabled ? `${o.role} · ${o.disabled}` : o.role}</span>
                    </span>
                </button>
            ))}

            {selected?.needsPin && (
                <div className="nqp-field">
                    <label htmlFor="nqp-approval-pin">{selected.name}&apos;s PIN</label>
                    <input
                        id="nqp-approval-pin"
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={20}
                        value={pin}
                        data-sheet-focus
                        onChange={(e) => setPin(e.target.value.replace(/\s/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                    />
                </div>
            )}

            {request?.approvalError && (
                <div className="nqp-row" data-static="true" role="alert">
                    <span className="nqp-line-sub" style={{ color: 'var(--vq-danger)', fontWeight: 700 }}>{request.approvalError}</span>
                </div>
            )}
        </Sheet>
    );
}
