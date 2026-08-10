import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import { role, vq } from '@/theme/runtime';
import {
    RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, ChevronDown,
    Wifi, KeyRound, Webhook, RotateCw, Clock, X, Store, ArrowRight,
} from 'lucide-react';

/**
 * SyncHealthPanel — T16 §3 Sync Status Dashboard.
 *
 * Three requirements drive the design here:
 *
 *  1. INSTANT LOCAL FEEDBACK. Every control updates local state before the
 *     network call resolves. Pressing "Sync Now" flips the badge to "Syncing…"
 *     on the same frame; it never waits on a marketplace API that can take 30s.
 *
 *  2. FRESHNESS THAT ACTUALLY MOVES. "Last synced 2 minutes ago" is recomputed
 *     from a ticking clock, not rendered once server-side. A dashboard left open
 *     used to claim "just now" an hour later.
 *
 *  3. SELF-SERVE ERROR RECOVERY. The Error Inspector shows the raw failure text
 *     and a Retry button, so a store owner can clear a transient failure without
 *     opening a support ticket.
 */

// ─── Badge vocabulary ─────────────────────────────────────────────────────────
const STATUS = {
    green:  { label: 'Healthy',        color: role.success[400], bg: role.success[950], border: role.success[800], Icon: CheckCircle2 },
    yellow: { label: 'Needs Attention', color: role.warning[400], bg: role.warning[950], border: role.warning[800], Icon: AlertTriangle },
    red:    { label: 'Action Required', color: role.danger[400],  bg: role.danger[950],  border: role.danger[800],  Icon: AlertCircle },
};

const statusOf = (key) => STATUS[key] ?? STATUS.yellow;

/**
 * Relative time, recomputed on every tick. Deliberately not date-fns — the
 * bundle does not already carry it and this is a dozen lines.
 */
function relativeTime(iso, now) {
    if (!iso) return 'never';

    const seconds = Math.round((now - new Date(iso).getTime()) / 1000);

    if (Number.isNaN(seconds)) return 'unknown';
    if (seconds < 10)  return 'just now';
    if (seconds < 60)  return `${seconds} seconds ago`;

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ─── Small presentational pieces ──────────────────────────────────────────────

function SignalPill({ icon: Icon, title, signal }) {
    const s = statusOf(signal?.status);

    return (
        <div
            title={signal?.detail ?? ''}
            style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 10px', borderRadius: 8,
                background: s.bg, border: `1px solid ${s.border}`,
                minWidth: 0, flex: '1 1 140px',
            }}
        >
            <Icon size={13} color={s.color} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color: vq.slate[500], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    {title}
                </div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {signal?.label ?? 'Unknown'}
                </div>
            </div>
        </div>
    );
}

function OverallBadge({ status, connectedCount, errorCount }) {
    const s = statusOf(status);
    const { Icon } = s;

    const summary = connectedCount === 0
        ? 'No channels connected'
        : errorCount > 0
            ? `${errorCount} channel${errorCount === 1 ? '' : 's'} need attention`
            : `${connectedCount} channel${connectedCount === 1 ? '' : 's'} healthy`;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 14px', borderRadius: 10,
            background: s.bg, border: `1px solid ${s.border}`,
        }}>
            <Icon size={17} color={s.color} />
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 11, color: vq.slate[400] }}>{summary}</div>
            </div>
        </div>
    );
}

// ─── Error Inspector ──────────────────────────────────────────────────────────

function ErrorInspector({ channels, storeSlug, onRetry, retrying }) {
    const [open, setOpen] = useState(false);

    const failing = useMemo(
        () => channels.filter((c) => c.status === 'red' || c.error_message),
        [channels],
    );

    if (failing.length === 0) return null;

    return (
        <div style={{
            background: role.danger[950],
            border: `1px solid ${role.danger[800]}`,
            borderRadius: 12,
            overflow: 'hidden',
        }}>
            <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, padding: '14px 18px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', color: 'inherit',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <AlertCircle size={17} color={role.danger[400]} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: role.danger[300] }}>
                            {failing.length} sync error{failing.length === 1 ? '' : 's'} need attention
                        </div>
                        <div style={{ fontSize: 11, color: vq.slate[400] }}>
                            {open ? 'Hide details' : 'Tap to inspect and retry'}
                        </div>
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    color={vq.slate[400]}
                    style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
            </button>

            {open && (
                <div style={{ borderTop: `1px solid ${role.danger[900]}`, padding: '4px 0' }}>
                    {failing.map((channel) => (
                        <div
                            key={channel.channel_id}
                            style={{
                                display: 'flex', flexWrap: 'wrap', gap: 12,
                                alignItems: 'flex-start', justifyContent: 'space-between',
                                padding: '14px 18px', borderBottom: `1px solid ${vq.slate[900]}`,
                            }}
                        >
                            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: vq.slate[200], marginBottom: 5 }}>
                                    {channel.channel_name}
                                    <span style={{ marginLeft: 8, fontSize: 10, color: vq.slate[500], fontWeight: 500 }}>
                                        {channel.platform_label}
                                    </span>
                                </div>
                                {/* Raw server error — deliberately not sanitised into a
                                    generic string. A store owner forwarding this exact
                                    text to support is far more useful than "Sync failed". */}
                                <pre style={{
                                    margin: 0, padding: '9px 11px', borderRadius: 7,
                                    background: vq.void[950] ?? '#05080f',
                                    border: `1px solid ${vq.slate[800]}`,
                                    color: role.danger[300], fontSize: 11, lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                    maxHeight: 140, overflowY: 'auto',
                                }}>
                                    {channel.error_message || channel.api?.detail || 'No error detail recorded.'}
                                </pre>
                            </div>

                            <button
                                onClick={() => onRetry(channel.channel_id)}
                                disabled={retrying === channel.channel_id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 14px', borderRadius: 8, border: 'none',
                                    background: retrying === channel.channel_id ? vq.slate[800] : role.danger[600],
                                    color: retrying === channel.channel_id ? vq.slate[500] : '#fff',
                                    fontSize: 12, fontWeight: 600,
                                    cursor: retrying === channel.channel_id ? 'not-allowed' : 'pointer',
                                    flexShrink: 0, whiteSpace: 'nowrap',
                                }}
                            >
                                <RotateCw size={13} className={retrying === channel.channel_id ? 'spin' : ''} />
                                {retrying === channel.channel_id ? 'Retrying…' : 'Retry Failed Sync'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SyncHealthPanel({ health, storeSlug, syncing, onSyncNow }) {
    // Local mirror of the server payload so optimistic updates can mutate it
    // without waiting for an Inertia round-trip.
    const [local, setLocal] = useState(health);
    const [retrying, setRetrying] = useState(null);
    const [now, setNow] = useState(() => Date.now());
    const [dismissed, setDismissed] = useState(false);
    const pollRef = useRef(null);

    // Re-sync local mirror whenever the server sends fresh props.
    useEffect(() => { setLocal(health); }, [health]);

    // Tick every 15s so relative timestamps stay honest on a long-open tab.
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(id);
    }, []);

    // While a sync is running, poll the lightweight JSON health endpoint so the
    // badges update live. Cleared on unmount — leaving this running was how the
    // previous prototype leaked a timer per navigation.
    useEffect(() => {
        if (!syncing) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return undefined;
        }

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(route('store.vensynq.health', { store_slug: storeSlug }), {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const data = await res.json();
                    setLocal(data.health);
                }
            } catch {
                // Polling is best-effort decoration. A failed poll must never
                // surface an error — the authoritative result arrives with the
                // Inertia response when the sync completes.
            }
        }, 3000);

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [syncing, storeSlug]);

    const channels = local?.channels ?? [];

    // Most recent successful sync across all channels — drives the header stamp.
    const lastSynced = useMemo(() => {
        const stamps = channels.map((c) => c.last_synced_at).filter(Boolean);
        if (stamps.length === 0) return null;
        return stamps.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
    }, [channels]);

    const handleSyncNow = useCallback(() => {
        // Optimistic: paint every connected channel as syncing immediately.
        setLocal((prev) => ({
            ...prev,
            channels: (prev?.channels ?? []).map((c) => ({ ...c, sync_status: 'syncing' })),
        }));
        onSyncNow();
    }, [onSyncNow]);

    const handleRetry = useCallback((channelId) => {
        setRetrying(channelId);

        router.post(
            route('store.vensynq.channels.retry', { store_slug: storeSlug, channel: channelId }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setRetrying(null),
            },
        );
    }, [storeSlug]);

    if (!local) return null;

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Header: overall badge + freshness + Sync Now ──────────────── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 14,
                alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #0d1e36 0%, #091220 100%)',
                border: '1px solid #1e3a5f', borderRadius: 12, padding: '16px 18px',
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <OverallBadge
                        status={local.overall}
                        connectedCount={local.connected_count ?? 0}
                        errorCount={local.error_count ?? 0}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: vq.slate[400], fontSize: 12 }}>
                        <Clock size={13} />
                        <span>
                            Last synced{' '}
                            <strong style={{ color: vq.slate[200], fontWeight: 600 }}>
                                {relativeTime(lastSynced, now)}
                            </strong>
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 22px', borderRadius: 10, border: 'none',
                        background: syncing ? vq.slate[800] : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: syncing ? vq.slate[500] : '#fff',
                        fontSize: 14, fontWeight: 700,
                        cursor: syncing ? 'wait' : 'pointer',
                        boxShadow: syncing ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
                        transition: 'all 0.2s', flexShrink: 0,
                    }}
                >
                    <RefreshCw size={16} className={syncing ? 'spin' : ''} />
                    {syncing ? 'Syncing…' : 'Sync Now'}
                </button>
            </div>

            {/* ── Indeterminate progress bar while a sync is in flight ──────── */}
            {syncing && (
                <div
                    role="progressbar"
                    aria-label="Sync in progress"
                    style={{ height: 3, borderRadius: 2, background: vq.slate[800], overflow: 'hidden' }}
                >
                    <div style={{
                        height: '100%', width: '35%', borderRadius: 2,
                        background: 'linear-gradient(90deg, #3b82f6, #a78bfa)',
                        animation: 'vensynq-indeterminate 1.1s ease-in-out infinite',
                    }} />
                </div>
            )}

            {/* ── Error Inspector ──────────────────────────────────────────── */}
            <ErrorInspector
                channels={channels}
                storeSlug={storeSlug}
                onRetry={handleRetry}
                retrying={retrying}
            />

            {/* ── Per-channel health cards ─────────────────────────────────── */}
            {channels.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                    {channels.map((channel) => {
                        const s = statusOf(channel.status);
                        const isSyncing = channel.sync_status === 'syncing';

                        return (
                            <div
                                key={channel.channel_id}
                                style={{
                                    background: vq.void[800] ?? '#0b1220',
                                    border: `1px solid ${channel.status === 'green' ? '#1e3a5f' : s.border}`,
                                    borderRadius: 12, padding: 16,
                                    display: 'flex', flexDirection: 'column', gap: 12,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 700, color: vq.slate[100],
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {channel.channel_name}
                                        </div>
                                        <div style={{ fontSize: 11, color: vq.slate[500], marginTop: 2 }}>
                                            {channel.platform_label} · synced {relativeTime(channel.last_synced_at, now)}
                                        </div>
                                    </div>

                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '4px 9px', borderRadius: 999,
                                        background: s.bg, border: `1px solid ${s.border}`,
                                        color: s.color, fontSize: 10, fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        whiteSpace: 'nowrap', flexShrink: 0,
                                    }}>
                                        {isSyncing
                                            ? <><RefreshCw size={10} className="spin" /> Syncing</>
                                            : <><s.Icon size={10} /> {s.label}</>}
                                    </span>
                                </div>

                                {/* Three independent signals, per the ticket's
                                    "API connection, Webhook status, Token expiration". */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    <SignalPill icon={Wifi}     title="API"     signal={channel.api} />
                                    <SignalPill icon={Webhook}  title="Webhook" signal={channel.webhook} />
                                    <SignalPill icon={KeyRound} title="Token"   signal={channel.token} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Empty state handled at Dashboard level ──────────────────── */}

            {/* Scoped keyframes — the parent page has no animation utilities. */}
            <style>{`
                @keyframes vensynq-indeterminate {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                .spin { animation: vensynq-spin 1s linear infinite; }
                @keyframes vensynq-spin { to { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .vensynq-root table { font-size: 11px; }
                }
            `}</style>
        </section>
    );
}
