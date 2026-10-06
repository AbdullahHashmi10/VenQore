import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { useT, Panel, PageHeader, Badge, Button, Input, EmptyState, KpiCard, BRAND } from '@/Platform/ui';
import {
    Mail, Search, RefreshCw, User, CheckCircle, Database, Layout,
    ArrowLeft, Calendar, Sparkles, Filter, Users
} from 'lucide-react';
import axios from 'axios';

export default function Index({ stats = {} }) {
    const t = useT();
    const [subscribers, setSubscribers] = useState({ cloud: [], digital: [], all: [] });
    const [loading, setLoading] = useState(false);
    const [activeList, setActiveList] = useState('cloud'); // cloud | digital | all
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSubscribers();
    }, []);

    const loadSubscribers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/VenQore/newsletter-hub/subscribers');
            if (res.data?.success) {
                setSubscribers({
                    cloud: res.data.cloud || [],
                    digital: res.data.digital || [],
                    all: res.data.all || []
                });
            }
        } catch (err) {
            console.error('Failed to load subscribers', err);
        } finally {
            setLoading(false);
        }
    };

    const getActiveData = () => {
        if (activeList === 'cloud') return subscribers.cloud;
        if (activeList === 'digital') return subscribers.digital;
        return subscribers.all;
    };

    const filteredData = getActiveData().filter(s =>
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <PlatformLayout title="Newsletter & Subscribers Hub">
            <Head title="Newsletter Hub — VenQore Platform" />

            <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Page Header ────────────────────────────────────────── */}
                <PageHeader
                    title="Newsletter & Subscribers Hub"
                    subtitle="Track audience growth, cloud platform insight updates, and standalone offline digital packages list rosters."
                    icon={Mail}
                    accent={BRAND.indigo}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Link href={route('platform.dashboard')}>
                                <Button variant="secondary" icon={ArrowLeft} size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                            <Button
                                variant="secondary"
                                icon={RefreshCw}
                                size="sm"
                                disabled={loading}
                                onClick={loadSubscribers}
                            >
                                {loading ? 'Refreshing…' : 'Refresh'}
                            </Button>
                        </div>
                    }
                />

                {/* ── KPI Metrics Bar ────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <KpiCard
                        label="Cloud Website List"
                        value={(stats.cloud_count ?? subscribers.cloud.length).toLocaleString()}
                        sub="Registered cloud leads"
                        icon={Layout}
                        accent={BRAND.sky}
                    />
                    <KpiCard
                        label="Digital Marketplace List"
                        value={(stats.digital_count ?? subscribers.digital.length).toLocaleString()}
                        sub="Standalone buyer updates"
                        icon={Database}
                        accent={BRAND.indigo}
                    />
                    <KpiCard
                        label="Gross Audience Reach"
                        value={(stats.total_count ?? subscribers.all.length).toLocaleString()}
                        sub="Total verified subscribers"
                        icon={Users}
                        accent={BRAND.emerald}
                    />
                </div>

                {/* ── Tabs & Search Filter ───────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Navigation tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: `1px solid ${t.border}`,
                        gap: 8,
                        paddingBottom: 2,
                    }}>
                        {[
                            { id: 'cloud', label: 'Cloud Website Subscribers', icon: Layout, count: subscribers.cloud.length },
                            { id: 'digital', label: 'Digital Products Subscribers', icon: Database, count: subscribers.digital.length },
                            { id: 'all', label: 'Complete Audience Roster', icon: Mail, count: subscribers.all.length },
                        ].map(tab => {
                            const isActive = activeList === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveList(tab.id)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 16px',
                                        fontSize: 13,
                                        fontWeight: 800,
                                        border: 'none',
                                        borderBottom: `2px solid ${isActive ? BRAND.indigo : 'transparent'}`,
                                        background: 'transparent',
                                        color: isActive ? t.ink : t.muted,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        marginBottom: -2,
                                    }}
                                >
                                    <Icon size={15} style={{ color: isActive ? BRAND.indigo : t.muted }} />
                                    <span>{tab.label}</span>
                                    <span style={{
                                        fontSize: 11,
                                        padding: '2px 7px',
                                        borderRadius: 999,
                                        background: isActive ? `${BRAND.indigo}18` : t.inputBg,
                                        color: isActive ? BRAND.indigo : t.muted,
                                        fontWeight: 700,
                                    }}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Input bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', maxWidth: 360, width: '100%' }}>
                            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted }} />
                            <Input
                                placeholder="Search by name or email…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Subscribers Table Panel ────────────────────────────── */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 640 }}>
                            <thead>
                                <tr style={{ background: t.panel2, borderBottom: `1px solid ${t.border}` }}>
                                    <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Subscriber Name
                                    </th>
                                    <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Email Address
                                    </th>
                                    <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Interest Focus
                                    </th>
                                    <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Status
                                    </th>
                                    <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Subscribed Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px 20px', textAlign: 'center', color: t.muted, fontSize: 13 }}>
                                            Loading subscribers list…
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <EmptyState
                                                icon={Mail}
                                                title="No subscribers found"
                                                message={searchQuery ? `No subscribers matched "${searchQuery}".` : 'No subscribers in this list category yet.'}
                                                action={
                                                    searchQuery ? (
                                                        <Button size="sm" variant="secondary" onClick={() => setSearchQuery('')}>
                                                            Clear Search
                                                        </Button>
                                                    ) : null
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map(sub => {
                                        const isBoth = sub.interest === 'both';
                                        const isDigital = sub.interest === 'digital';
                                        const interestColor = isBoth ? BRAND.emerald : isDigital ? BRAND.indigo : BRAND.sky;
                                        const interestLabel = isBoth ? 'Both Updates' : isDigital ? 'Digital Products' : 'Cloud Platform';

                                        return (
                                            <tr
                                                key={sub.id}
                                                style={{ borderBottom: `1px solid ${t.rowBorder}`, transition: 'background 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = t.hover; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <td style={{ padding: '14px 20px', fontSize: 13.5, fontWeight: 700, color: t.ink }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <User size={14} style={{ color: t.muted }} />
                                                        <span>{sub.name || '—'}</span>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '14px 20px', fontSize: 13, color: t.sub }}>
                                                    <a
                                                        href={`mailto:${sub.email}`}
                                                        style={{ color: BRAND.sky, textDecoration: 'none', fontWeight: 600 }}
                                                    >
                                                        {sub.email}
                                                    </a>
                                                </td>

                                                <td style={{ padding: '14px 20px' }}>
                                                    <Badge color={interestColor} tone="soft">
                                                        {interestLabel}
                                                    </Badge>
                                                </td>

                                                <td style={{ padding: '14px 20px' }}>
                                                    <Badge color={BRAND.emerald} tone="soft">
                                                        {sub.status || 'Active'}
                                                    </Badge>
                                                </td>

                                                <td style={{ padding: '14px 20px', fontSize: 12, color: t.muted, fontFamily: 'monospace' }}>
                                                    {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>
        </PlatformLayout>
    );
}
