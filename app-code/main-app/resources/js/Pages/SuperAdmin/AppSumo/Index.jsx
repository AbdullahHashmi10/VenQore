import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, Button,
    Input, Drawer, Field, Select, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import {
    Ticket, Plus, Download, Upload, Trash2, Search, Filter,
    CheckCircle, AlertCircle, RefreshCcw, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AppSumoIndex({ codes, filters, stats = {} }) {
    const t = useT();
    const { data, setData, post, delete: destroy, processing, reset } = useForm({
        count: 100,
        tier: 'Tier 1',
        codes: '',
    });

    const [showGenerate, setShowGenerate] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

    const handleGenerate = (e) => {
        e.preventDefault();
        post(route('platform.appsumo.generate'), {
            onSuccess: () => {
                setShowGenerate(false);
                reset('count');
            },
        });
    };

    const handleImport = (e) => {
        e.preventDefault();
        post(route('platform.appsumo.import'), {
            onSuccess: () => {
                setShowImport(false);
                reset('codes');
            },
        });
    };

    const handlePurge = () => {
        const passcode = prompt('Enter your action passcode to confirm purging unredeemed codes:');
        if (passcode) {
            destroy(route('platform.appsumo.purge'), {
                data: { passcode },
            });
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('platform.appsumo.index'), { search, status: filters?.status }, { preserveState: true });
    };

    const handleStatusFilter = (val) => {
        router.get(route('platform.appsumo.index'), { search, status: val }, { preserveState: true });
    };

    const codeList = codes?.data ?? [];

    return (
        <OneGlanceLayout title="AppSumo Code Bank" mode="admin" activeMenu="AppSumo / LTD">
            <Head title="Platform HQ | AppSumo Code Bank" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <PageHeader
                    icon={Ticket}
                    accent={BRAND.indigo}
                    title="AppSumo Code Bank"
                    subtitle="Manage one-time lifetime deal (LTD) redemption codes and track claimed merchant stores."
                    actions={
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Button variant="primary" icon={Plus} onClick={() => setShowGenerate(true)}>
                                Bulk Generate
                            </Button>
                            <Button variant="secondary" icon={Upload} onClick={() => setShowImport(true)}>
                                Import Codes
                            </Button>
                            <a href={route('platform.appsumo.export')} style={{ textDecoration: 'none' }}>
                                <Button variant="secondary" icon={Download}>
                                    Export CSV
                                </Button>
                            </a>
                            <Button variant="danger" icon={Trash2} onClick={handlePurge}>
                                Clear Unused
                            </Button>
                        </div>
                    }
                />

                {/* KPI stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Codes
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {(stats.total || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Issued in catalog</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Available for Claim
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.emerald, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {(stats.available || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Unredeemed vouchers</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Redeemed Stores
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.indigo, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {(stats.redeemed || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Activated by merchants</div>
                    </Panel>
                </div>

                {/* Filter Toolbar */}
                <Panel pad={16}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: '1 1 300px', maxWidth: 460 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by code or merchant email…"
                                    style={{ paddingLeft: 36 }}
                                />
                            </div>
                            <Button type="submit" variant="primary">
                                Search
                            </Button>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: t.muted }}>Status:</span>
                            <Select
                                value={filters?.status || ''}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    { value: 'available', label: 'Available Only' },
                                    { value: 'redeemed', label: 'Redeemed Only' },
                                ]}
                                style={{ width: 170 }}
                            />
                        </div>
                    </div>
                </Panel>

                {/* Codes Table */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                            <thead>
                                <tr>
                                    {['Redemption Code', 'Plan Tier', 'Status', 'Store Link', 'Issued'].map((h, idx) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 18px',
                                                textAlign: idx === 4 ? 'right' : 'left',
                                                color: t.muted,
                                                fontWeight: 800,
                                                fontSize: 11,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                background: t.panel2,
                                                borderBottom: `1px solid ${t.border}`,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {codeList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                            <EmptyState
                                                icon={Ticket}
                                                title="No codes found"
                                                message="Generate a batch of AppSumo LTD codes or import them from a CSV file."
                                                action={
                                                    <Button variant="primary" icon={Plus} onClick={() => setShowGenerate(true)}>
                                                        Bulk Generate Codes
                                                    </Button>
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    codeList.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="vq-row"
                                            style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 800,
                                                    fontSize: 13.5,
                                                    color: t.ink,
                                                    background: t.inputBg,
                                                    border: `1px solid ${t.border}`,
                                                    padding: '3px 8px',
                                                    borderRadius: 7,
                                                }}>
                                                    {item.code}
                                                </span>
                                            </td>

                                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.sub, fontSize: 13, fontWeight: 600 }}>
                                                {item.plan_tier}
                                            </td>

                                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                {item.is_redeemed ? (
                                                    <div>
                                                        <Badge color={BRAND.emerald} tone="soft">
                                                            <CheckCircle size={11} style={{ marginRight: 4 }} /> Redeemed
                                                        </Badge>
                                                        {item.redeemed_by_email && (
                                                            <div style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>
                                                                {item.redeemed_by_email}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge color={BRAND.sky} tone="soft">
                                                        <AlertCircle size={11} style={{ marginRight: 4 }} /> Available
                                                    </Badge>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                {item.tenant ? (
                                                    <Link
                                                        href={route('store.dashboard', { store_slug: item.tenant.slug })}
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 700,
                                                            color: BRAND.indigo,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            textDecoration: 'none',
                                                        }}
                                                    >
                                                        <span>{item.tenant.name}</span>
                                                        <ExternalLink size={12} />
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: t.faint, fontSize: 13 }}>—</span>
                                                )}
                                            </td>

                                            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right', color: t.muted, fontSize: 12 }}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {codes?.last_page > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 20px',
                            borderTop: `1px solid ${t.border}`,
                            flexWrap: 'wrap',
                            gap: 12,
                        }}>
                            <span style={{ fontSize: 12.5, color: t.muted }}>
                                Page {codes.current_page} of {codes.last_page} · {codes.total} codes total
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={ChevronLeft}
                                    disabled={codes.current_page <= 1}
                                    onClick={() => router.get(route('platform.appsumo.index'), { search, status: filters?.status, page: codes.current_page - 1 }, { preserveState: true })}
                                >
                                    Prev
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={codes.current_page >= codes.last_page}
                                    onClick={() => router.get(route('platform.appsumo.index'), { search, status: filters?.status, page: codes.current_page + 1 }, { preserveState: true })}
                                >
                                    Next <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Panel>
            </div>

            {/* Bulk Generate Drawer */}
            <Drawer
                open={showGenerate}
                onClose={() => setShowGenerate(false)}
                title="Bulk Generate Codes"
                subtitle="Generate batches of random alphanumeric lifetime deal codes"
                width={480}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowGenerate(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleGenerate} disabled={processing} icon={Plus}>
                            {processing ? 'Generating…' : 'Generate Codes'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field label="Quantity (Max 1,000)">
                        <Input
                            type="number"
                            min="1"
                            max="1000"
                            value={data.count}
                            onChange={(e) => setData('count', e.target.value)}
                        />
                    </Field>

                    <Field label="Target Plan Tier">
                        <Select
                            value={data.tier}
                            onChange={(e) => setData('tier', e.target.value)}
                            options={[
                                { value: 'Tier 1', label: 'Tier 1 (Single Store)' },
                                { value: 'Tier 2', label: 'Tier 2 (3 Stores)' },
                                { value: 'Tier 3', label: 'Tier 3 (10 Stores)' },
                            ]}
                        />
                    </Field>
                </form>
            </Drawer>

            {/* Import Codes Drawer */}
            <Drawer
                open={showImport}
                onClose={() => setShowImport(false)}
                title="Import External Codes"
                subtitle="Paste comma or newline separated codes to register"
                width={520}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowImport(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleImport} disabled={processing} icon={Upload}>
                            {processing ? 'Importing…' : 'Start Import'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field label="Codes (CSV or newline separated)">
                        <textarea
                            rows={8}
                            placeholder="AS-1234-ABCD, AS-5678-EFGH..."
                            value={data.codes}
                            onChange={(e) => setData('codes', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                fontSize: 13,
                                borderRadius: 12,
                                background: t.inputBg,
                                color: t.ink,
                                border: `1px solid ${t.border}`,
                                fontFamily: 'monospace',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </Field>

                    <Field label="Assign to Plan Tier">
                        <Select
                            value={data.tier}
                            onChange={(e) => setData('tier', e.target.value)}
                            options={[
                                { value: 'Tier 1', label: 'Tier 1 (Single Store)' },
                                { value: 'Tier 2', label: 'Tier 2 (3 Stores)' },
                                { value: 'Tier 3', label: 'Tier 3 (10 Stores)' },
                            ]}
                        />
                    </Field>
                </form>
            </Drawer>
        </OneGlanceLayout>
    );
}
