import React, { useState, useCallback } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyPipeline from './Components/MoneyPipeline';
import { role, vq } from '@/theme/runtime';
import {
    ChevronLeft, Landmark, Clock, CheckCircle2, AlertCircle,
    AlertTriangle, Info, Loader2,
} from 'lucide-react';

/**
 * Payouts — T17 payout confirmation.
 *
 * This screen exists because auto-sweeping money into the bank on a timer is
 * worse than the ghost-cash problem it tries to solve: it creates deposits that
 * may never have landed, and once the ledger says money arrived that didn't,
 * bank reconciliation is unrecoverable.
 *
 * So the owner confirms. Once per payout batch, not once per order — a fortnight
 * of Amazon sales is a single click.
 */

const money = (n, currency = 'GBP') => {
    const symbols = { GBP: '£', USD: '$', EUR: '€', PKR: '₨', AED: 'AED' };
    return `${symbols[currency] ?? currency + ''}${Number(n ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
}) : '—');

// ─── Confirmation row ─────────────────────────────────────────────────────────

function ConfirmRow({ payout, bankAccounts, storeSlug }) {
    // Pre-filled with the estimate purely as a convenience, but the owner is
    // expected to overwrite it with what the bank statement says. That gap is
    // exactly what we want to capture.
    const [actual, setActual] = useState(String(payout.expected_net ?? ''));
    const [bankId, setBankId] = useState(bankAccounts?.[0]?.id ?? '');
    const [externalId, setExternalId] = useState('');
    const [saving, setSaving] = useState(false);

    const expected = Number(payout.expected_net ?? 0);
    const entered = Number(actual);
    const variance = Number.isFinite(entered) ? entered - expected : 0;
    const hasVariance = Math.abs(variance) >= 0.01;

    const submit = useCallback(() => {
        setSaving(true);
        router.post(
            route('store.vensynq.payouts.confirm', { store_slug: storeSlug, payout: payout.id }),
            {
                actual_net: actual,
                bank_account_id: bankId || null,
                external_payout_id: externalId || null,
            },
            { preserveScroll: true, onFinish: () => setSaving(false) },
        );
    }, [actual, bankId, externalId, payout.id, storeSlug]);

    const inputStyle = {
        width: '100%', padding: '9px 11px', borderRadius: 8,
        background: '#0a1220', border: `1px solid ${vq.slate[800]}`,
        color: vq.slate[100], fontSize: 13, outline: 'none',
    };
    const labelStyle = {
        display: 'block', fontSize: 10, fontWeight: 700, color: vq.slate[500],
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5,
    };

    return (
        <div style={{
            background: vq.void[800] ?? '#0b1220',
            border: `1px solid ${payout.is_overdue ? role.danger[800] : role.warning[800]}`,
            borderRadius: 12, padding: 18,
            display: 'flex', flexDirection: 'column', gap: 14,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: vq.slate[100] }}>
                        {payout.channel?.name ?? 'Marketplace'}
                    </div>
                    <div style={{ fontSize: 11, color: vq.slate[500], marginTop: 3 }}>
                        {fmtDate(payout.period_start)} — {fmtDate(payout.period_end)}
                        {payout.expected_at_human ? ` · expected ${payout.expected_at_human}` : ''}
                    </div>
                </div>

                {payout.is_overdue && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 999,
                        background: role.danger[950], border: `1px solid ${role.danger[800]}`,
                        color: role.danger[400], fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                    }}>
                        <AlertTriangle size={10} /> Overdue
                    </span>
                )}
            </div>

            {/* Expected breakdown */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 10, padding: '12px 14px', borderRadius: 9,
                background: '#0a1220', border: `1px solid ${vq.slate[800]}`,
            }}>
                {[
                    ['Gross sales', payout.expected_gross, vq.slate[200]],
                    ['Est. fees', -payout.expected_fees, role.danger[400]],
                    ...(Number(payout.expected_reserve) > 0
                        ? [['Reserve held', -payout.expected_reserve, role.warning[400]]]
                        : []),
                    ['Expected net', payout.expected_net, role.success[400]],
                ].map(([label, amount, color]) => (
                    <div key={label}>
                        <div style={{ fontSize: 10, color: vq.slate[600], textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                            {label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 3 }}>
                            {money(amount, payout.currency)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                    <label style={labelStyle} htmlFor={`actual-${payout.id}`}>
                        Amount actually received
                    </label>
                    <input
                        id={`actual-${payout.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                        style={{
                            ...inputStyle,
                            borderColor: hasVariance ? role.warning[700] : vq.slate[800],
                        }}
                    />
                </div>

                <div>
                    <label style={labelStyle} htmlFor={`bank-${payout.id}`}>Deposited into</label>
                    <select
                        id={`bank-${payout.id}`}
                        value={bankId}
                        onChange={(e) => setBankId(e.target.value)}
                        style={inputStyle}
                    >
                        {(bankAccounts ?? []).length === 0 && <option value="">No bank accounts</option>}
                        {(bankAccounts ?? []).map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}{b.bank_name ? ` — ${b.bank_name}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle} htmlFor={`ext-${payout.id}`}>
                        Platform reference (optional)
                    </label>
                    <input
                        id={`ext-${payout.id}`}
                        value={externalId}
                        onChange={(e) => setExternalId(e.target.value)}
                        placeholder="e.g. Payout #8841"
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Live variance explanation — set expectations before they submit */}
            {hasVariance && (
                <div style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '11px 13px', borderRadius: 9,
                    background: role.warning[950], border: `1px solid ${role.warning[800]}`,
                }}>
                    <Info size={13} color={role.warning[400]} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: role.warning[300], lineHeight: 1.5 }}>
                        {variance < 0
                            ? `${money(Math.abs(variance), payout.currency)} less than estimated. This usually means storage, advertising or dispute fees. It will be recorded as fee variance — your books stay balanced.`
                            : `${money(variance, payout.currency)} more than estimated. The difference will be recorded as a fee variance credit.`}
                    </span>
                </div>
            )}

            <button
                onClick={submit}
                disabled={saving || actual === ''}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '11px 18px', borderRadius: 9, border: 'none',
                    background: saving || actual === ''
                        ? vq.slate[800]
                        : 'linear-gradient(135deg, rgb(var(--vq-emerald-600)), rgb(var(--vq-emerald-700)))',
                    color: saving || actual === '' ? vq.slate[600] : '#fff',
                    fontSize: 13, fontWeight: 700,
                    cursor: saving ? 'wait' : actual === '' ? 'not-allowed' : 'pointer',
                }}
            >
                {saving ? <Loader2 size={14} className="spin" /> : <Landmark size={14} />}
                {saving ? 'Confirming…' : 'Confirm & deposit to bank'}
            </button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Payouts({
    due = [], pending = [], recent = [], pipeline = null, bankAccounts = [],
}) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const store = props.store;

    return (
        <OneGlanceLayout>
            <Head title="Marketplace Payouts — VenSynQ" />

            <div className="vensynq-root" style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1421 100%)',
                color: vq.slate[200], fontFamily: "'Inter', sans-serif", padding: '0 0 80px',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(90deg, #0a0f1a, #111827)',
                    borderBottom: '1px solid #1e3a5f', padding: '20px 32px',
                    display: 'flex', alignItems: 'center', gap: 14,
                }}>
                    <Link
                        href={route('store.vensynq.index', { store_slug: store?.slug })}
                        style={{
                            width: 36, height: 36, borderRadius: 10, background: vq.slate[800],
                            border: '1px solid #334155', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: vq.slate[400], flexShrink: 0,
                        }}
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{
                            fontSize: 20, fontWeight: 700, margin: 0,
                            background: 'linear-gradient(90deg, rgb(var(--vq-blue-400)), rgb(var(--vq-violet-400)))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Marketplace Payouts
                        </h1>
                        <p style={{ margin: 0, fontSize: 12, color: vq.slate[500] }}>
                            Confirm what actually landed in your bank
                        </p>
                    </div>
                </div>

                {/* Flash */}
                {['success', 'error', 'warning'].map((k) => flash[k] && (
                    <div key={k} style={{
                        margin: '16px 32px 0', padding: '12px 16px', borderRadius: 8, fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: k === 'success' ? role.success[950] : k === 'warning' ? role.warning[950] : role.danger[950],
                        border: `1px solid ${k === 'success' ? role.success[800] : k === 'warning' ? role.warning[800] : role.danger[800]}`,
                        color: k === 'success' ? role.success[400] : k === 'warning' ? role.warning[300] : role.danger[400],
                    }}>
                        {k === 'success' ? <CheckCircle2 size={15} /> : k === 'warning' ? <Info size={15} /> : <AlertCircle size={15} />}
                        {flash[k]}
                    </div>
                ))}

                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

                    <MoneyPipeline
                        pipeline={pipeline}
                        clearingEnabled={true}
                        storeSlug={store?.slug}
                    />

                    {/* Ready to confirm */}
                    <section>
                        <h2 style={{
                            fontSize: 13, fontWeight: 700, color: vq.slate[400],
                            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
                        }}>
                            Ready to confirm ({due.length})
                        </h2>

                        {due.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '44px 20px',
                                background: vq.void[800] ?? '#0b1220',
                                border: '1px solid #1e3a5f', borderRadius: 12,
                            }}>
                                <CheckCircle2 size={32} color={role.success[600]} style={{ marginBottom: 12 }} />
                                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: vq.slate[300] }}>
                                    Nothing waiting on you
                                </h3>
                                <p style={{ margin: 0, fontSize: 12, color: vq.slate[500] }}>
                                    Payouts appear here once their settlement window has passed.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {due.map((p) => (
                                    <ConfirmRow
                                        key={p.id}
                                        payout={p}
                                        bankAccounts={bankAccounts}
                                        storeSlug={store?.slug}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Still accruing */}
                    {pending.length > 0 && (
                        <section>
                            <h2 style={{
                                fontSize: 13, fontWeight: 700, color: vq.slate[400],
                                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
                            }}>
                                Still accruing ({pending.length})
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {pending.map((p) => (
                                    <div key={p.id} style={{
                                        display: 'flex', flexWrap: 'wrap', gap: 10,
                                        alignItems: 'center', justifyContent: 'space-between',
                                        padding: '13px 16px', borderRadius: 10,
                                        background: vq.void[800] ?? '#0b1220',
                                        border: '1px solid #1e3a5f',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            <Clock size={15} color={vq.slate[500]} style={{ flexShrink: 0 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: vq.slate[200] }}>
                                                    {p.channel?.name ?? 'Marketplace'}
                                                </div>
                                                <div style={{ fontSize: 11, color: vq.slate[500], marginTop: 2 }}>
                                                    Expected {p.expected_at_human ?? fmtDate(p.expected_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: vq.slate[100], flexShrink: 0 }}>
                                            {money(p.expected_net, p.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* History */}
                    {recent.length > 0 && (
                        <section>
                            <h2 style={{
                                fontSize: 13, fontWeight: 700, color: vq.slate[400],
                                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
                            }}>
                                Recently confirmed
                            </h2>

                            <div style={{
                                background: vq.void[800] ?? '#0b1220',
                                border: '1px solid #1e3a5f', borderRadius: 12, overflowX: 'auto',
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
                                    <thead>
                                        <tr style={{ background: '#0f1f35', borderBottom: '1px solid #1e3a5f' }}>
                                            {['Channel', 'Confirmed', 'Expected', 'Received', 'Variance'].map((h) => (
                                                <th key={h} style={{
                                                    padding: '10px 14px', textAlign: 'left', color: vq.slate[500],
                                                    fontWeight: 700, fontSize: 10, textTransform: 'uppercase',
                                                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recent.map((p) => {
                                            const v = Number(p.variance ?? 0);
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #162032' }}>
                                                    <td style={{ padding: '10px 14px', color: vq.slate[200], fontWeight: 600 }}>
                                                        {p.channel?.name ?? '—'}
                                                    </td>
                                                    <td style={{ padding: '10px 14px', color: vq.slate[400], whiteSpace: 'nowrap' }}>
                                                        {fmtDate(p.confirmed_at)}
                                                    </td>
                                                    <td style={{ padding: '10px 14px', color: vq.slate[400], whiteSpace: 'nowrap' }}>
                                                        {money(p.expected_net, p.currency)}
                                                    </td>
                                                    <td style={{ padding: '10px 14px', color: vq.slate[100], fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                        {money(p.actual_net, p.currency)}
                                                    </td>
                                                    <td style={{
                                                        padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 700,
                                                        color: Math.abs(v) < 0.01
                                                            ? vq.slate[600]
                                                            : v < 0 ? role.danger[400] : role.success[400],
                                                    }}>
                                                        {Math.abs(v) < 0.01 ? 'Exact' : money(v, p.currency)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <style>{`
                .spin { animation: vensynq-spin 1s linear infinite; }
                @keyframes vensynq-spin { to { transform: rotate(360deg); } }
`}</style>
        </OneGlanceLayout>
    );
}
