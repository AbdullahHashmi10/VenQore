import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { useT, Panel, PageHeader, Badge, Button, Input, EmptyState, KpiCard, BRAND } from '@/Platform/ui';
import {
    ShieldAlert, CheckCircle, Bug, Terminal, MonitorSmartphone,
    Sparkles, Copy, ArrowLeft, Clock, Building2, User, Globe,
    CheckCircle2, FileText, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function Errors({ errors, filters }) {
    const t = useT();
    const [selected, setSelected] = useState(null);
    const [resolveNote, setResolveNote] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const isResolved = Boolean(filters?.resolved);
    const statusFilter = isResolved ? 'resolved' : 'open';
    const currentType = filters?.type || null;

    function setFilter(resolved, type = currentType) {
        router.get(route('platform.health.errors'), { resolved, type }, { preserveState: true });
    }

    function resolveError(errId = selected?.id) {
        if (!errId) return;
        router.post(route('platform.health.errors.resolve', errId), { note: resolveNote }, {
            onSuccess: () => {
                if (selected?.id === errId) {
                    setSelected(null);
                    setResolveNote('');
                }
            }
        });
    }

    function resolveAll() {
        if (!confirm('Mark ALL current open errors as resolved?')) return;
        router.post(route('platform.health.errors.resolve-all'), {}, {
            onSuccess: () => setSelected(null)
        });
    }

    function detectFixes() {
        if (!confirm('⚠️ HEURISTIC SCAN\n\nThis estimates fixes by file modification times. Auto-resolved items will be marked for verification.\n\nProceed?')) return;
        router.post(route('platform.health.errors.detect-fixes'), {}, {
            onFinish: () => setSelected(null)
        });
    }

    const copyToClipboard = (err) => {
        const text = `Error: ${err.message}\nFile: ${err.file || 'N/A'}:${err.line || 'N/A'}\nURL: ${err.url || 'N/A'}\nStore: ${err.tenant?.name || 'N/A'}\nUser: ${err.user?.name || 'N/A'}\nOccurrences: ${err.occurrence_count}x\nLast Seen: ${new Date(err.last_seen_at).toLocaleString()}\n\nStack Trace:\n${err.stack_trace || 'N/A'}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(err.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const copyAllErrors = () => {
        if (!errors.data || errors.data.length === 0) return;
        const text = errors.data.map((err, idx) => {
            return `--- ERROR #${idx + 1} ---\nError: ${err.message}\nType: ${err.type}\nFile: ${err.file || 'N/A'}:${err.line || 'N/A'}\nURL: ${err.url || 'N/A'}\nStore: ${err.tenant?.name || 'N/A'}\nUser: ${err.user?.name || 'N/A'}\nOccurrences: ${err.occurrence_count}x\nLast Seen: ${new Date(err.last_seen_at).toLocaleString()}`;
        }).join('\n\n========================================\n\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('All listed error summaries copied to clipboard!');
        });
    };

    // Derived telemetry KPIs
    const stats = useMemo(() => {
        const list = errors?.data || [];
        const total = list.length;
        const backendCount = list.filter(e => e.type === 'backend').length;
        const frontendCount = list.filter(e => e.type === 'frontend').length;
        const totalEvents = list.reduce((acc, e) => acc + (parseInt(e.occurrence_count) || 1), 0);
        return { total, backendCount, frontendCount, totalEvents };
    }, [errors]);

    return (
        <PlatformLayout title="System Health & Error Logs">
            <Head title="System Health & Error Logs — VenQore Platform" />

            <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Page Header ────────────────────────────────────────── */}
                <PageHeader
                    title="System Health & Exception Tracker"
                    subtitle="Platform-wide exception telemetry, real-time frontend crash alerts, and stack trace debugging."
                    icon={ShieldAlert}
                    accent={BRAND.rose}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Link href={route('platform.dashboard')}>
                                <Button variant="secondary" icon={ArrowLeft} size="sm">
                                    Dashboard
                                </Button>
                            </Link>

                            {/* Status filter toggle */}
                            <div style={{
                                display: 'inline-flex',
                                background: t.inputBg,
                                border: `1px solid ${t.border}`,
                                borderRadius: 12,
                                padding: 3,
                                gap: 2,
                            }}>
                                <button
                                    onClick={() => setFilter(0)}
                                    style={{
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: !isResolved ? `${BRAND.rose}1f` : 'transparent',
                                        color: !isResolved ? BRAND.rose : t.muted,
                                        boxShadow: !isResolved ? `0 0 0 1px ${BRAND.rose}44` : 'none',
                                    }}
                                >
                                    Open Errors
                                </button>
                                <button
                                    onClick={() => setFilter(1)}
                                    style={{
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: isResolved ? `${BRAND.emerald}1f` : 'transparent',
                                        color: isResolved ? BRAND.emerald : t.muted,
                                        boxShadow: isResolved ? `0 0 0 1px ${BRAND.emerald}44` : 'none',
                                    }}
                                >
                                    Resolved
                                </button>
                            </div>

                            {/* Batch actions */}
                            {errors?.data?.length > 0 && !isResolved && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={Sparkles}
                                        onClick={detectFixes}
                                        style={{ color: BRAND.amber }}
                                        title="Estimate fixes by file modification timestamps"
                                    >
                                        Heuristic Scan
                                    </Button>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        icon={CheckCircle}
                                        onClick={resolveAll}
                                    >
                                        Resolve All
                                    </Button>
                                </>
                            )}
                            {errors?.data?.length > 0 && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={Copy}
                                    onClick={copyAllErrors}
                                >
                                    Copy All
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* ── KPI Metrics Bar ────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <KpiCard
                        label={isResolved ? "Resolved Issues" : "Active Issue Groups"}
                        value={stats.total}
                        sub={isResolved ? "Archived error logs" : "Requiring investigation"}
                        icon={Bug}
                        accent={isResolved ? BRAND.emerald : BRAND.rose}
                    />
                    <KpiCard
                        label="Backend Exceptions"
                        value={stats.backendCount}
                        sub="Server & API crashes"
                        icon={Terminal}
                        accent={BRAND.rose}
                    />
                    <KpiCard
                        label="Frontend Crashes"
                        value={stats.frontendCount}
                        sub="Client browser errors"
                        icon={MonitorSmartphone}
                        accent={BRAND.amber}
                    />
                    <KpiCard
                        label="Total Occurrence Events"
                        value={stats.totalEvents.toLocaleString()}
                        sub="Aggregate crash occurrences"
                        icon={RefreshCw}
                        accent={BRAND.indigo}
                    />
                </div>

                {/* ── Filter & Search Toolbar ────────────────────────────── */}
                <Panel pad={14} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
                            Filter Type:
                        </span>
                        <Button
                            size="sm"
                            variant={!currentType ? 'primary' : 'secondary'}
                            onClick={() => setFilter(filters.resolved, null)}
                        >
                            All Logs ({stats.total})
                        </Button>
                        <Button
                            size="sm"
                            variant={currentType === 'backend' ? 'primary' : 'secondary'}
                            icon={Terminal}
                            onClick={() => setFilter(filters.resolved, 'backend')}
                        >
                            Backend ({stats.backendCount})
                        </Button>
                        <Button
                            size="sm"
                            variant={currentType === 'frontend' ? 'primary' : 'secondary'}
                            icon={MonitorSmartphone}
                            onClick={() => setFilter(filters.resolved, 'frontend')}
                        >
                            Frontend ({stats.frontendCount})
                        </Button>
                    </div>

                    <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>
                        Showing {errors?.data?.length || 0} issues
                    </div>
                </Panel>

                {/* ── Main Two-Column Layout ──────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 440px' : '1fr', gap: 20, alignItems: 'start' }}>
                    {/* Error list column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(!errors?.data || errors.data.length === 0) ? (
                            <Panel pad={48}>
                                <EmptyState
                                    icon={CheckCircle2}
                                    title={isResolved ? "No resolved error logs" : "Clean Slate — Zero Open Errors"}
                                    message={isResolved ? "No resolved errors matched your current filter criteria." : "All tracked backend exceptions and frontend errors have been resolved."}
                                    action={
                                        isResolved ? (
                                            <Button size="sm" variant="secondary" onClick={() => setFilter(0)}>
                                                View Open Errors
                                            </Button>
                                        ) : null
                                    }
                                />
                            </Panel>
                        ) : (
                            errors.data.map(err => {
                                const isSelected = selected?.id === err.id;
                                const isFrontend = err.type === 'frontend';

                                return (
                                    <div
                                        key={err.id}
                                        onClick={() => setSelected(err)}
                                        style={{
                                            background: isSelected
                                                ? (t.isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2')
                                                : t.panel,
                                            border: `1px solid ${isSelected ? (t.isDark ? 'rgba(239, 68, 68, 0.4)' : '#fca5a5') : t.border}`,
                                            borderRadius: 16,
                                            padding: '16px 20px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            position: 'relative',
                                            boxShadow: isSelected ? 'var(--vq-elev-2)' : 'none',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.borderColor = t.border2;
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.borderColor = t.border;
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                {isFrontend ? (
                                                    <Badge color={BRAND.amber} tone="soft">
                                                        <MonitorSmartphone size={12} /> Frontend
                                                    </Badge>
                                                ) : (
                                                    <Badge color={BRAND.rose} tone="soft">
                                                        <Terminal size={12} /> Backend
                                                    </Badge>
                                                )}

                                                {err.status_code && (
                                                    <Badge color={BRAND.rose} tone="soft">
                                                        HTTP {err.status_code}
                                                    </Badge>
                                                )}

                                                <Badge color={BRAND.indigo} tone="soft">
                                                    {err.occurrence_count}x Events
                                                </Badge>

                                                {err.is_resolved && (
                                                    <Badge color={BRAND.emerald} tone="soft">
                                                        <CheckCircle size={11} /> Resolved
                                                    </Badge>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11.5, color: t.muted, fontFamily: 'monospace' }}>
                                                    {new Date(err.last_seen_at).toLocaleString()}
                                                </span>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(err); }}
                                                    style={{
                                                        background: t.inputBg,
                                                        border: `1px solid ${t.border}`,
                                                        borderRadius: 8,
                                                        padding: 6,
                                                        cursor: 'pointer',
                                                        color: copiedId === err.id ? BRAND.emerald : t.muted,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                    }}
                                                    title="Copy Error"
                                                >
                                                    <Copy size={13} />
                                                </button>

                                                {!err.is_resolved && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); resolveError(err.id); }}
                                                        style={{
                                                            background: `${BRAND.emerald}18`,
                                                            border: `1px solid ${BRAND.emerald}40`,
                                                            borderRadius: 8,
                                                            padding: 6,
                                                            cursor: 'pointer',
                                                            color: BRAND.emerald,
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                        }}
                                                        title="Quick Resolve"
                                                    >
                                                        <CheckCircle size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h3 style={{
                                            margin: 0,
                                            fontSize: 14.5,
                                            fontWeight: 800,
                                            color: t.ink,
                                            letterSpacing: '-0.01em',
                                            lineHeight: 1.4,
                                            wordBreak: 'break-word',
                                        }}>
                                            {err.message}
                                        </h3>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            marginTop: 10,
                                            paddingTop: 10,
                                            borderTop: `1px solid ${t.border}`,
                                            fontSize: 12,
                                            color: t.muted,
                                            flexWrap: 'wrap',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                <FileText size={13} style={{ flexShrink: 0 }} />
                                                <span style={{ fontFamily: 'monospace', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {err.file ? `${err.file}:${err.line}` : (err.url || 'Unknown Source')}
                                                </span>
                                            </div>

                                            {err.tenant && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: t.sub }}>
                                                    <Building2 size={13} style={{ color: BRAND.indigo }} />
                                                    <span>{err.tenant.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Error details sidebar */}
                    {selected && (
                        <Panel
                            pad={20}
                            style={{
                                position: 'sticky',
                                top: 20,
                                maxHeight: 'calc(100vh - 120px)',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 20,
                                border: `1px solid ${t.border2}`,
                                boxShadow: 'var(--vq-elev-3)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <Bug size={16} style={{ color: BRAND.rose }} />
                                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted }}>
                                            Error Details
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.faint }}>
                                        ID #{selected.id}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 6 }}>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={Copy}
                                        onClick={() => copyToClipboard(selected)}
                                    >
                                        Copy
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelected(null)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Exception message */}
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted, marginBottom: 6 }}>
                                    Exception Message
                                </div>
                                <div style={{
                                    padding: '12px 14px',
                                    borderRadius: 12,
                                    background: t.isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                                    border: `1px solid ${t.isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                                    color: t.isDark ? '#fca5a5' : '#b91c1c',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    lineHeight: 1.5,
                                    wordBreak: 'break-word',
                                }}>
                                    {selected.message}
                                </div>
                            </div>

                            {/* Contextual metadata */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        Store / Tenant
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Building2 size={13} style={{ color: BRAND.indigo }} />
                                        {selected.tenant?.name || 'N/A'}
                                    </div>
                                </div>

                                <div style={{ padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        User / Session
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <User size={13} style={{ color: BRAND.sky }} />
                                        {selected.user?.name || 'N/A'}
                                    </div>
                                </div>

                                <div style={{ gridColumn: 'span 2', padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        Endpoint / URL
                                    </div>
                                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: t.sub, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Globe size={13} style={{ color: BRAND.amber, flexShrink: 0 }} />
                                        {selected.url || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Stack trace snippet */}
                            {selected.stack_trace && (
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted, marginBottom: 6 }}>
                                        Stack Trace Snippet
                                    </div>
                                    <pre style={{
                                        margin: 0,
                                        padding: 12,
                                        borderRadius: 12,
                                        background: t.isDark ? '#0b0f19' : '#1e293b',
                                        color: '#e2e8f0',
                                        border: `1px solid ${t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                                        fontSize: 11,
                                        lineHeight: 1.6,
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        maxHeight: 240,
                                        overflowY: 'auto',
                                    }}>
                                        {selected.stack_trace}
                                    </pre>
                                </div>
                            )}

                            {/* Resolution status / note */}
                            {selected.is_resolved ? (
                                <div style={{
                                    padding: 14,
                                    borderRadius: 12,
                                    background: `${BRAND.emerald}14`,
                                    border: `1px solid ${BRAND.emerald}33`,
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: BRAND.emerald, marginBottom: 4 }}>
                                        Resolution Note
                                    </div>
                                    <div style={{ fontSize: 13, color: t.ink, fontWeight: 600 }}>
                                        {selected.resolution_note || 'Resolved without an extra note.'}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                                    <Input
                                        placeholder="Add resolution note (optional)..."
                                        value={resolveNote}
                                        onChange={e => setResolveNote(e.target.value)}
                                    />
                                    <Button
                                        variant="success"
                                        icon={CheckCircle2}
                                        onClick={() => resolveError(selected.id)}
                                        style={{ width: '100%' }}
                                    >
                                        Mark as Resolved
                                    </Button>
                                </div>
                            )}
                        </Panel>
                    )}
                </div>
            </div>
        </PlatformLayout>
    );
}
