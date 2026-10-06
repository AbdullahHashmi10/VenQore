import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { useT, Panel, PageHeader, Badge, Button, EmptyState, KpiCard, BRAND } from '@/Platform/ui';
import {
    MessagesSquare, CheckCircle, ArrowLeft, Mail, Clock, CheckCircle2,
    Building2, Inbox, Send, User, ChevronRight, MessageSquareText
} from 'lucide-react';

export default function Contacts({ submissions, filters }) {
    const t = useT();
    const [selected, setSelected] = useState(null);

    const statusFilter = filters?.status || 'new';
    const isNew = statusFilter === 'new';

    function setFilter(status) {
        router.get(route('platform.health.contacts'), { status }, { preserveState: true });
    }

    function markAsRead() {
        if (!selected) return;
        router.post(route('platform.health.contacts.read', selected.id), {}, {
            onSuccess: () => {
                const updated = { ...selected, status: 'read', read_at: new Date().toISOString() };
                setSelected(updated);
            }
        });
    }

    const items = submissions?.data || [];

    const stats = useMemo(() => {
        const total = items.length;
        const unreadCount = items.filter(s => s.status === 'new').length;
        const readCount = items.filter(s => s.status === 'read').length;
        return { total, unreadCount, readCount };
    }, [items]);

    return (
        <PlatformLayout title="Contact Desk & Customer Inquiries">
            <Head title="Contact Desk — VenQore Platform" />

            <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Page Header ────────────────────────────────────────── */}
                <PageHeader
                    title="Contact Desk & Inquiries"
                    subtitle="Direct contact form inquiries submitted via public marketing landing pages and trial interest flows."
                    icon={MessagesSquare}
                    accent={BRAND.sky}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Link href={route('platform.dashboard')}>
                                <Button variant="secondary" icon={ArrowLeft} size="sm">
                                    Dashboard
                                </Button>
                            </Link>

                            {/* Status Filter Toggle */}
                            <div style={{
                                display: 'inline-flex',
                                background: t.inputBg,
                                border: `1px solid ${t.border}`,
                                borderRadius: 12,
                                padding: 3,
                                gap: 2,
                            }}>
                                <button
                                    onClick={() => setFilter('new')}
                                    style={{
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: isNew ? `${BRAND.sky}1f` : 'transparent',
                                        color: isNew ? BRAND.sky : t.muted,
                                        boxShadow: isNew ? `0 0 0 1px ${BRAND.sky}44` : 'none',
                                    }}
                                >
                                    Unread Inquiries
                                </button>
                                <button
                                    onClick={() => setFilter('read')}
                                    style={{
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: !isNew ? `${BRAND.emerald}1f` : 'transparent',
                                        color: !isNew ? BRAND.emerald : t.muted,
                                        boxShadow: !isNew ? `0 0 0 1px ${BRAND.emerald}44` : 'none',
                                    }}
                                >
                                    Archived / Read
                                </button>
                            </div>
                        </div>
                    }
                />

                {/* ── KPI Metrics Bar ────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <KpiCard
                        label="Inquiry Queue"
                        value={stats.total}
                        sub={`In "${statusFilter}" status`}
                        icon={Mail}
                        accent={BRAND.sky}
                    />
                    <KpiCard
                        label="Unread Submissions"
                        value={stats.unreadCount}
                        sub="Awaiting operator response"
                        icon={MessagesSquare}
                        accent={BRAND.amber}
                    />
                    <KpiCard
                        label="Handled / Read"
                        value={stats.readCount}
                        sub="Processed submissions"
                        icon={CheckCircle}
                        accent={BRAND.emerald}
                    />
                </div>

                {/* ── Two-Column Inquiries View ──────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 460px' : '1fr', gap: 20, alignItems: 'start' }}>
                    {/* Inquiries list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {items.length === 0 ? (
                            <Panel pad={48}>
                                <EmptyState
                                    icon={Inbox}
                                    title="Inbox Zero 🎉"
                                    message={`No ${statusFilter} contact inquiries found in this queue.`}
                                    action={
                                        !isNew ? (
                                            <Button size="sm" variant="secondary" onClick={() => setFilter('new')}>
                                                View Unread Inquiries
                                            </Button>
                                        ) : null
                                    }
                                />
                            </Panel>
                        ) : (
                            items.map(sub => {
                                const isSelected = selected?.id === sub.id;
                                const isUnread = sub.status === 'new';

                                return (
                                    <div
                                        key={sub.id}
                                        onClick={() => setSelected(sub)}
                                        style={{
                                            background: isSelected
                                                ? (t.isDark ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff')
                                                : t.panel,
                                            border: `1px solid ${isSelected ? (t.isDark ? 'rgba(56, 189, 248, 0.4)' : '#bae6fd') : t.border}`,
                                            borderLeft: isUnread ? `4px solid ${BRAND.sky}` : `1px solid ${t.border}`,
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
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 14.5, fontWeight: 800, color: t.ink }}>
                                                    {sub.name}
                                                </span>
                                                <span style={{ fontSize: 12, color: t.muted }}>
                                                    &lt;{sub.email}&gt;
                                                </span>
                                                {isUnread ? (
                                                    <Badge color={BRAND.sky} tone="soft">
                                                        New
                                                    </Badge>
                                                ) : (
                                                    <Badge color={BRAND.emerald} tone="soft">
                                                        <CheckCircle size={11} /> Read
                                                    </Badge>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: t.muted, fontFamily: 'monospace' }}>
                                                <Clock size={12} />
                                                <span>{new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: t.sub, marginBottom: 6 }}>
                                            {sub.subject || 'No Subject'}
                                        </div>

                                        <p style={{
                                            margin: 0,
                                            fontSize: 12.5,
                                            color: t.muted,
                                            lineHeight: 1.5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '90%',
                                        }}>
                                            {sub.message}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Inquiry Details Side Panel */}
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
                                        <Mail size={16} style={{ color: BRAND.sky }} />
                                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted }}>
                                            Inquiry Details
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.faint }}>
                                        ID #{selected.id}
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelected(null)}
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Contact information card */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        Sender Name
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: t.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <User size={13} style={{ color: BRAND.indigo }} />
                                        {selected.name}
                                    </div>
                                </div>

                                <div style={{ padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        Email Address
                                    </div>
                                    <a
                                        href={`mailto:${selected.email}`}
                                        style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.sky, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                        <Mail size={13} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.email}</span>
                                    </a>
                                </div>

                                <div style={{ padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        Company / Store
                                    </div>
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: t.sub, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Building2 size={13} style={{ color: BRAND.amber }} />
                                        {selected.company || 'Not Specified'}
                                    </div>
                                </div>

                                <div style={{ padding: 12, borderRadius: 10, background: t.inputBg, border: `1px solid ${t.border}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: t.muted, marginBottom: 4 }}>
                                        Submitted At
                                    </div>
                                    <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: t.sub, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Clock size={13} style={{ color: t.muted }} />
                                        {new Date(selected.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Subject & Full message */}
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted, marginBottom: 6 }}>
                                    Subject
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: t.ink, marginBottom: 12 }}>
                                    {selected.subject || 'No Subject Provided'}
                                </div>

                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted, marginBottom: 6 }}>
                                    Message Body
                                </div>
                                <div style={{
                                    padding: '14px 16px',
                                    borderRadius: 12,
                                    background: t.inputBg,
                                    border: `1px solid ${t.border}`,
                                    color: t.ink,
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {selected.message}
                                </div>
                            </div>

                            {/* Action footer */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                                <a
                                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || 'Inquiry'}`)}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Button
                                        variant="primary"
                                        icon={Send}
                                        style={{ width: '100%' }}
                                    >
                                        Reply via Email
                                    </Button>
                                </a>

                                {selected.status === 'new' && (
                                    <Button
                                        variant="success"
                                        icon={CheckCircle2}
                                        onClick={markAsRead}
                                        style={{ width: '100%' }}
                                    >
                                        Mark as Read
                                    </Button>
                                )}
                            </div>
                        </Panel>
                    )}
                </div>
            </div>
        </PlatformLayout>
    );
}
