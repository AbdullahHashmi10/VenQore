import React, { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { role, vq } from '@/theme/runtime';
import {
    ShoppingCart, Clock, Landmark, ChevronRight, AlertTriangle,
    Info, ArrowRight, CheckCircle2,
} from 'lucide-react';

/**
 * MoneyPipeline — T17 "Where is my money right now?"
 *
 * Three stages, left to right:
 *
 *   [ Online Sales ] → [ Held by Platforms ] → [ Cleared to Bank ]
 *
 * The middle stage is the whole point. Before T17 a $100 Woo sale showed up as
 * $100 of spendable cash the instant the order landed, even though Stripe holds
 * it for ~2 days and Amazon for ~14. Owners spent money they did not have.
 *
 * Deliberately shows "estimated" language on the middle stage. Fees are
 * projections from the channel's fee_percentage and will not match settlement to
 * the cent — presenting them as exact would make the product look broken every
 * single payout.
 */

const money = (n, currency = 'GBP') => {
    const symbols = { GBP: '£', USD: '$', EUR: '€', PKR: '₨', AED: 'AED' };
    const symbol = symbols[currency] ?? `${currency} `;
    const value = Number(n ?? 0);

    return `${symbol}${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

function Stage({ icon: Icon, label, amount, currency, sub, tone, emphasis }) {
    const tones = {
        neutral: { color: vq.slate[300], bg: 'transparent',        border: '#1e3a5f' },
        warn:    { color: role.warning[400], bg: role.warning[950], border: role.warning[800] },
        good:    { color: role.success[400], bg: role.success[950], border: role.success[800] },
    };
    const t = tones[tone] ?? tones.neutral;

    return (
        <div style={{
            flex: '1 1 200px', minWidth: 0,
            background: t.bg, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '16px 18px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Icon size={14} color={t.color} />
                <span style={{
                    fontSize: 10, fontWeight: 700, color: vq.slate[500],
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    {label}
                </span>
            </div>

            <div style={{
                fontSize: emphasis ? 26 : 22, fontWeight: 700,
                color: emphasis ? t.color : vq.slate[100],
                lineHeight: 1.15, wordBreak: 'break-word',
            }}>
                {money(amount, currency)}
            </div>

            {sub && (
                <div style={{ marginTop: 6, fontSize: 11, color: vq.slate[500], lineHeight: 1.45 }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

export default function MoneyPipeline({ pipeline, clearingEnabled, storeSlug, currency = 'GBP' }) {
    const [expanded, setExpanded] = useState(false);
    const [toggling, setToggling] = useState(false);

    const handleToggleClearing = useCallback(() => {
        setToggling(true);
        router.post(
            route('store.vensynq.clearing.toggle', { store_slug: storeSlug }),
            { enabled: !clearingEnabled },
            { preserveScroll: true, onFinish: () => setToggling(false) },
        );
    }, [clearingEnabled, storeSlug]);

    // ── Off state: explain the value before asking them to switch it on ──────
    if (!clearingEnabled) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #0d1e36 0%, #091220 100%)',
                border: '1px dashed #2f5c96', borderRadius: 12, padding: '18px 20px',
                display: 'flex', flexWrap: 'wrap', gap: 14,
                alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', flex: '1 1 340px', minWidth: 0 }}>
                    <Info size={17} color="rgb(var(--vq-blue-400))" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: vq.slate[100], marginBottom: 4 }}>
                            Marketplace Clearing is off
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: vq.slate[400], lineHeight: 1.55, maxWidth: 560 }}>
                            Online sales currently post straight to cash the moment the order arrives — but
                            Amazon holds funds around 14 days and Stripe around 2. Turning this on holds
                            that money in a clearing pool so your cash balance reflects what you can
                            actually spend. <strong style={{ color: vq.slate[300] }}>Existing sales are not changed.</strong>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggleClearing}
                    disabled={toggling}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 18px', borderRadius: 9, border: 'none',
                        background: toggling ? vq.slate[800] : 'linear-gradient(135deg, rgb(var(--vq-blue-500)), #1d4ed8)',
                        color: toggling ? vq.slate[500] : '#fff',
                        fontSize: 13, fontWeight: 700,
                        cursor: toggling ? 'wait' : 'pointer', flexShrink: 0,
                    }}
                >
                    <CheckCircle2 size={14} />
                    {toggling ? 'Turning on…' : 'Turn on Clearing'}
                </button>
            </div>
        );
    }

    if (!pipeline) return null;

    const awaiting = pipeline.awaiting_confirmation ?? { count: 0, amount: 0 };
    const channels = pipeline.by_channel ?? [];

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Payout confirmation prompt ───────────────────────────────── */}
            {awaiting.count > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 12,
                    alignItems: 'center', justifyContent: 'space-between',
                    background: role.warning[950], border: `1px solid ${role.warning[800]}`,
                    borderRadius: 12, padding: '14px 18px',
                }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                        <Landmark size={17} color={role.warning[400]} style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: role.warning[300] }}>
                                {awaiting.count} payout{awaiting.count === 1 ? '' : 's'} ready to confirm
                                {' ·'}{money(awaiting.amount, currency)}
                            </div>
                            <div style={{ fontSize: 11, color: vq.slate[400], marginTop: 2 }}>
                                Check your bank, then confirm the amount that actually landed.
                            </div>
                        </div>
                    </div>

                    <a
                        href={route('store.vensynq.payouts', { store_slug: storeSlug })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '9px 16px', borderRadius: 8,
                            background: role.warning[600], color: '#1a1200',
                            fontSize: 12, fontWeight: 700, textDecoration: 'none',
                            flexShrink: 0, whiteSpace: 'nowrap',
                        }}
                    >
                        Confirm payouts <ArrowRight size={13} />
                    </a>
                </div>
            )}

            {/* ── The three stages ─────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0d1e36 0%, #091220 100%)',
                border: '1px solid #1e3a5f', borderRadius: 12, padding: 18,
            }}>
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 12,
                    alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
                }}>
                    <h2 style={{
                        margin: 0, fontSize: 13, fontWeight: 700, color: vq.slate[300],
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>
                        Where your money is
                    </h2>

                    {pipeline.overdue_count > 0 && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 999,
                            background: role.danger[950], border: `1px solid ${role.danger[800]}`,
                            color: role.danger[400], fontSize: 11, fontWeight: 700,
                        }}>
                            <AlertTriangle size={11} />
                            {pipeline.overdue_count} overdue
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 10 }}>
                    <Stage
                        icon={ShoppingCart}
                        label="Online sales in pipeline"
                        amount={pipeline.gross_in_pipeline}
                        currency={currency}
                        sub="Gross value of orders not yet paid out"
                        tone="neutral"
                    />

                    <ChevronRight size={18} color={vq.slate[700]} style={{ alignSelf: 'center', flexShrink: 0 }} />

                    <Stage
                        icon={Clock}
                        label="Held by platforms"
                        amount={pipeline.pending_payout}
                        currency={currency}
                        sub={`After ${money(pipeline.estimated_fees, currency)} estimated fees${
                            pipeline.held_in_reserve > 0
                                ? ` and ${money(pipeline.held_in_reserve, currency)} reserve`
                                : ''
                        }`}
                        tone="warn"
                        emphasis
                    />

                    <ChevronRight size={18} color={vq.slate[700]} style={{ alignSelf: 'center', flexShrink: 0 }} />

                    <Stage
                        icon={Landmark}
                        label="Cleared to bank"
                        amount={pipeline.cleared_to_bank}
                        currency={currency}
                        sub="Confirmed payouts you can actually spend"
                        tone="good"
                    />
                </div>

                {/* Honesty note — these are estimates, and saying so up front
                    prevents the "your numbers are wrong" support ticket. */}
                <p style={{
                    margin: '13px 0 0', fontSize: 11, color: vq.slate[600],
                    lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start',
                }}>
                    <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    Fees shown are estimates. The exact amount is trued up automatically when you
                    confirm each payout, and any difference is recorded as fee variance.
                </p>

                {/* ── Per-channel breakdown ────────────────────────────────── */}
                {channels.length > 0 && (
                    <>
                        <button
                            onClick={() => setExpanded(v => !v)}
                            aria-expanded={expanded}
                            style={{
                                marginTop: 12, padding: 0, background: 'transparent', border: 'none',
                                color: 'rgb(var(--vq-blue-400))', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            {expanded ? 'Hide' : 'Show'} breakdown by channel
                            <ChevronRight
                                size={13}
                                style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                            />
                        </button>

                        {expanded && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {channels.map(ch => (
                                    <div
                                        key={ch.channel_id}
                                        style={{
                                            display: 'flex', flexWrap: 'wrap', gap: 10,
                                            alignItems: 'center', justifyContent: 'space-between',
                                            padding: '11px 13px', borderRadius: 9,
                                            background: '#0a1220',
                                            border: `1px solid ${ch.is_overdue ? role.danger[800] : vq.slate[800]}`,
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: vq.slate[200] }}>
                                                {ch.channel_name}
                                            </div>
                                            <div style={{ fontSize: 11, color: ch.is_overdue ? role.danger[400] : vq.slate[500], marginTop: 2 }}>
                                                {ch.is_overdue
                                                    ? 'Payout is overdue — check your platform account'
                                                    : ch.arrives_human
                                                        ? `Arriving ${ch.arrives_human}`
                                                        : 'Awaiting settlement date'}
                                            </div>
                                        </div>

                                        <div style={{ fontSize: 15, fontWeight: 700, color: vq.slate[100], flexShrink: 0 }}>
                                            {money(ch.amount, ch.currency ?? currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
