import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import {
    ShieldCheck,
    ShieldOff,
    UserX,
    Coins,
    AlertTriangle,
    X,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import Toggle from '@/Components/Toggle';

// ─── Confirmation modal ────────────────────────────────────────────────────────
function DisableConfirmModal({ usersWithApprovals = [], store, onCancel }) {
    const [phrase, setPhrase] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const isValid = phrase.trim().toUpperCase() === 'TURN OFF';

    const handleConfirm = () => {
        if (!isValid || submitting) return;
        setSubmitting(true);
        setServerError('');

        router.post(
            route('store.settings.approvals.disable-all', { store_slug: store?.slug }),
            { confirmation: phrase.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onCancel();
                },
                onError: (errors) => {
                    setServerError(errors?.confirmation || 'Something went wrong. Please try again.');
                    setSubmitting(false);
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in"
                onClick={onCancel}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-md bg-surface border border-line dark:border-neutral-700 rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in zoom-in-95 slide-in-from-bottom-3 duration-fast"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                                Turn Off Approvals?
                            </h3>
                            <p className="text-2xs sm:text-xs text-ink-muted font-medium mt-0.5">
                                This will clear all approval rules for every team member.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-8 h-8 rounded-xl bg-app hover:bg-interactive-hover border border-line text-ink-muted hover:text-ink flex items-center justify-center transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Warning body */}
                <div className="space-y-3 text-xs text-ink-secondary leading-relaxed">
                    <p>
                        You are about to <strong>turn off the approval system</strong> for your entire store.
                        This means all transactions will post immediately — no manager review, no second person check.
                    </p>
                    {usersWithApprovals.length > 0 && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 space-y-2">
                            <p className="font-semibold text-2xs uppercase tracking-wider">
                                {usersWithApprovals.length} team member{usersWithApprovals.length !== 1 ? 's' : ''} will have their approval rules removed:
                            </p>
                            <ul className="space-y-0.5">
                                {usersWithApprovals.map((u) => (
                                    <li key={u.id} className="flex items-center gap-1.5 text-2xs font-medium">
                                        <span className="w-5 h-5 rounded-lg bg-red-200 dark:bg-red-900/60 flex items-center justify-center text-red-700 dark:text-red-300 font-bold text-3xs shrink-0">
                                            {(u.name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                        {u.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <p className="text-ink-muted">
                        To confirm, type <span className="font-mono font-bold text-ink bg-sunken px-1.5 py-0.5 rounded-lg">TURN OFF</span> in the box below:
                    </p>
                </div>

                {/* Input */}
                <div className="space-y-2">
                    <input
                        type="text"
                        value={phrase}
                        onChange={(e) => { setPhrase(e.target.value); setServerError(''); }}
                        placeholder="Type TURN OFF"
                        className={`w-full px-4 py-3 bg-sunken border rounded-xl text-sm font-mono outline-none focus:ring-2 transition-all ${
                            serverError
                                ? 'border-red-400 focus:ring-red-400/30'
                                : isValid
                                ? 'border-green-400 focus:ring-green-400/30'
                                : 'border-line focus:ring-brand-500'
                        }`}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    />
                    {serverError && (
                        <p className="text-2xs text-red-500 font-medium">{serverError}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-line">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-line bg-app hover:bg-interactive-hover text-ink text-xs font-bold transition-colors"
                    >
                        Cancel, Keep Approvals On
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!isValid || submitting}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                        {submitting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <ShieldOff size={14} />
                        )}
                        {submitting ? 'Turning Off…' : 'Yes, Turn Off Approvals'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function SettingCard({ icon: Icon, iconClass, title, subtitle, children }) {
    return (
        <div className="bg-surface rounded-2xl border border-line p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${iconClass}`}>
                    <Icon size={24} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{subtitle}</p>
                </div>
            </div>
            <div className="border-t border-line pt-4">
                {children}
            </div>
        </div>
    );
}

// ─── On/Off description pill ───────────────────────────────────────────────────
function StatePill({ active, onLabel, offLabel }) {
    return (
        <span className={`inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            active
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                : 'bg-neutral-500/10 text-ink-muted border-line'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            {active ? onLabel : offLabel}
        </span>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ApprovalsSection({ data, setData, store, usersWithApprovals = [] }) {
    const currencySymbol = store?.currency_symbol || '$';
    const [showDisableModal, setShowDisableModal] = useState(false);

    const approvalsOn = Boolean(data.approval_admin_enabled);
    const selfApprovalBlocked = Boolean(data.approval_strict_owner_separation);

    const handleToggleApprovals = (nextVal) => {
        if (!nextVal && usersWithApprovals && usersWithApprovals.length > 0) {
            // There are members with approvals — require confirmation before disabling
            setShowDisableModal(true);
            return;
        }
        setData('approval_admin_enabled', nextVal);
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-slow">

            {/* ── Card 1: Master Toggle ─────────────────────────────────────── */}
            <SettingCard
                icon={ShieldCheck}
                iconClass="bg-brand-500/10 dark:bg-brand-500/20 border-brand-500/30 text-brand-600 dark:text-brand-400"
                title="Approval System"
                subtitle="Control whether your store requires a second person to review and approve transactions before they go through."
            >
                <div className="space-y-3">
                    <Toggle
                        enabled={approvalsOn}
                        onChange={handleToggleApprovals}
                        label="Require approvals before transactions are posted"
                    />

                    <div className="space-y-2 pl-1">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-2xs text-ink-muted leading-relaxed">
                                <strong className="text-ink-secondary">Turning this ON</strong> — Any transaction that meets your approval rules will be held for a manager or supervisor to review before it is posted. Nobody can skip this step.
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldOff size={13} className="text-red-400 mt-0.5 shrink-0" />
                            <p className="text-2xs text-ink-muted leading-relaxed">
                                <strong className="text-ink-secondary">Turning this OFF</strong> — All transactions post immediately for everyone, with no review step. Individual staff approval rules will also be cleared.
                            </p>
                        </div>
                    </div>

                    <div className="pt-1">
                        <StatePill
                            active={approvalsOn}
                            onLabel="Approvals Active"
                            offLabel="Approvals Off — Transactions Post Immediately"
                        />
                    </div>
                </div>
            </SettingCard>

            {/* ── Card 2: Self-Approval Prevention ─────────────────────────── */}
            <SettingCard
                icon={UserX}
                iconClass="bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400"
                title="Prevent Self-Approvals"
                subtitle="Stop people from approving transactions they submitted themselves. This is a key safeguard to maintain an honest check-and-balance system."
            >
                <div className="space-y-3">
                    <Toggle
                        enabled={selfApprovalBlocked}
                        onChange={(v) => setData('approval_strict_owner_separation', v)}
                        label="Nobody can approve their own submission"
                    />

                    <div className="space-y-2 pl-1">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-2xs text-ink-muted leading-relaxed">
                                <strong className="text-ink-secondary">Turning this ON</strong> — If you submit a transaction, you cannot be the one who approves it. A different person must review it — even if you are the store owner.
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-2xs text-ink-muted leading-relaxed">
                                <strong className="text-ink-secondary">Turning this OFF</strong> — People can approve transactions they created. This is not recommended — it removes a key protection against errors or misuse.
                            </p>
                        </div>
                    </div>

                    <div className="pt-1">
                        <StatePill
                            active={selfApprovalBlocked}
                            onLabel="Self-Approval Blocked"
                            offLabel="Self-Approval Allowed (Not Recommended)"
                        />
                    </div>
                </div>
            </SettingCard>

            {/* ── Card 3: Global Threshold ──────────────────────────────────── */}
            <SettingCard
                icon={Coins}
                iconClass="bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/30 text-violet-600 dark:text-violet-400"
                title="Approval Threshold Amount"
                subtitle="Set a store-wide amount limit. Any transaction above this amount will automatically be sent for approval, no matter who submits it."
            >
                <div className="space-y-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted pointer-events-none">
                            {currencySymbol}
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.approval_amount_threshold ?? '0'}
                            onChange={(e) => setData('approval_amount_threshold', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-sunken border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2 pl-1">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-2xs text-ink-muted leading-relaxed">
                                <strong className="text-ink-secondary">When set above 0</strong> — Any transaction worth more than this amount will require approval before posting, across the whole store.
                                Example: set to <span className="font-mono font-bold text-ink-secondary">{currencySymbol}10,000</span> and every transaction above that goes to a manager first.
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-2xs text-ink-muted leading-relaxed">
                                <strong className="text-ink-secondary">When set to 0</strong> — No amount-based rule is applied. Only individual staff rules will decide what needs approval.
                            </p>
                        </div>
                    </div>
                </div>
            </SettingCard>

            {/* ── Confirm-disable modal ─────────────────────────────────────── */}
            {showDisableModal && (
                <DisableConfirmModal
                    usersWithApprovals={usersWithApprovals}
                    store={store}
                    onCancel={() => setShowDisableModal(false)}
                />
            )}
        </div>
    );
}
