import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, StatusBadge, Button,
    Input, Drawer, Field, Select, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import {
    SlidersHorizontal, Search, Plus, ArrowRight, Zap,
    Clock, Building2, Store, X, ChevronLeft, ChevronRight,
    ShieldAlert
} from 'lucide-react';

// ── Override Apply Drawer ─────────────────────────────────────────────────────

function OverrideDrawer({ open, tenant, availableKeys, onClose }) {
    const t = useT();
    const { data, setData, post, processing, errors, reset } = useForm({
        override_key:         '',
        override_value:       '',
        reason:               '',
        expires_at:           '',
        notify_user:          true,
        notification_message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.tenants.overrides.apply', { tenant: tenant.id }), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!tenant) return null;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Apply Override"
            subtitle={`${tenant.name} · Current Plan: ${tenant.plan || 'trial'}`}
            width={520}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submit}
                        icon={Zap}
                        disabled={processing || !data.override_key}
                    >
                        {processing ? 'Applying…' : 'Apply Live Override'}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Live Override notice banner */}
                <div style={{
                    background: 'rgba(245, 158, 11, 0.10)',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    fontSize: 13,
                    color: t.ink,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    lineHeight: 1.5,
                }}>
                    <Zap size={18} style={{ color: BRAND.amber, flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <b style={{ color: BRAND.amber }}>Live Override Effect</b>
                        <div style={{ color: t.sub, fontSize: 12.5, marginTop: 2 }}>
                            This change invalidates cached entitlements immediately. The merchant will receive this updated allowance right away.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Limit Key" error={errors.override_key}>
                        <Select
                            value={data.override_key}
                            onChange={(e) => setData('override_key', e.target.value)}
                            options={[
                                { value: '', label: '-- Select key --' },
                                ...availableKeys.map((k) => ({ value: k, label: k })),
                            ]}
                        />
                    </Field>

                    <Field label="New Allowance" hint="Leave blank for unlimited (∞)" error={errors.override_value}>
                        <Input
                            value={data.override_value}
                            onChange={(e) => setData('override_value', e.target.value)}
                            placeholder="e.g. 1000 or blank (∞)"
                        />
                    </Field>
                </div>

                <Field label="Internal Reason" hint="Visible only to platform admins" error={errors.reason}>
                    <Input
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        placeholder="e.g. Sales concession, VIP tier adjustment, enterprise deal"
                    />
                </Field>

                <Field label="Expires At" hint="Leave blank for permanent override" error={errors.expires_at}>
                    <Input
                        type="datetime-local"
                        value={data.expires_at}
                        onChange={(e) => setData('expires_at', e.target.value)}
                    />
                </Field>

                <div style={{
                    background: t.inputBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={data.notify_user}
                            onChange={(e) => setData('notify_user', e.target.checked)}
                            style={{ accentColor: BRAND.indigo, width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>
                            Send in-app notification to merchant
                        </span>
                    </label>

                    {data.notify_user && (
                        <Field label="Custom Notification Message" hint="Leave blank to use default system notice" error={errors.notification_message}>
                            <textarea
                                value={data.notification_message}
                                onChange={(e) => setData('notification_message', e.target.value)}
                                placeholder="e.g. Your store SKU limit has been upgraded to 5,000 products by our support team."
                                style={{
                                    width: '100%',
                                    padding: '10px 13px',
                                    fontSize: 13,
                                    borderRadius: 11,
                                    background: t.panelSolid,
                                    color: t.ink,
                                    fontFamily: 'inherit',
                                    border: `1px solid ${t.border}`,
                                    outline: 'none',
                                    minHeight: 70,
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </Field>
                    )}
                </div>
            </form>
        </Drawer>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantOverrides({ tenants, filters }) {
    const t = useT();
    const [drawerTenant, setDrawerTenant] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? '');

    const doSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('platform.tenants.overrides'), { search }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearch('');
        router.get(route('platform.tenants.overrides'), {}, { preserveState: true });
    };

    const removeOverride = (tenantId, overrideId) => {
        if (confirm('Remove this override? The tenant will revert to the plan default immediately.')) {
            router.delete(route('platform.tenants.overrides.remove', { tenant: tenantId, override: overrideId }), {
                preserveScroll: true,
            });
        }
    };

    const tenantsList = tenants?.data ?? [];
    const totalWithOverrides = tenantsList.filter((te) => te.plan_overrides?.length > 0).length;
    const totalOverridesCount = tenantsList.reduce((acc, te) => acc + (te.plan_overrides?.length || 0), 0);

    return (
        <OneGlanceLayout title="Tenant Overrides" mode="admin" activeMenu="Tenant Overrides">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* V6 Page Header */}
                <PageHeader
                    icon={SlidersHorizontal}
                    accent={BRAND.indigo}
                    title="Tenant Overrides"
                    subtitle="Apply per-tenant limit overrides. These take priority over any plan default."
                />

                {/* Quick KPI Stat Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Tenants
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {tenants?.total ?? tenantsList.length}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
                            Registered merchant databases
                        </div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Tenants with Overrides
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.amber, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {totalWithOverrides}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
                            Custom limits active on this page
                        </div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Active Override Rules
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.indigo, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {totalOverridesCount}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
                            Individual feature exemptions
                        </div>
                    </Panel>
                </div>

                {/* Search & Filter Toolbar */}
                <Panel pad={16}>
                    <form onSubmit={doSearch} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 440 }}>
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: t.muted,
                                    pointerEvents: 'none',
                                }}
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by store name or slug…"
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                        <Button type="submit" variant="primary">
                            Search
                        </Button>
                        {filters?.search && (
                            <Button type="button" variant="secondary" onClick={clearSearch}>
                                Clear
                            </Button>
                        )}
                    </form>
                </Panel>

                {/* Tenants Table Panel */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                            <thead>
                                <tr>
                                    {['Store', 'Plan', 'Status', 'Active Overrides', 'Actions'].map((h, idx) => (
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
                                {tenantsList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                            <EmptyState
                                                icon={Store}
                                                title="No tenants found"
                                                message={search ? `No results matching "${search}". Try searching with a different term.` : 'No tenants are registered in this database.'}
                                                action={search ? <Button variant="secondary" size="sm" onClick={clearSearch}>Reset search</Button> : null}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    tenantsList.map((tenant) => {
                                        const overrides = tenant.plan_overrides || [];
                                        return (
                                            <tr
                                                key={tenant.id}
                                                className="vq-row"
                                                style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                {/* Store Info */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: 800, color: t.ink, fontSize: 14 }}>
                                                        {tenant.name}
                                                    </div>
                                                    <div style={{ fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: t.sub }}>ID #{tenant.id}</span>
                                                        {tenant.slug && <span>· {tenant.slug}</span>}
                                                    </div>
                                                </td>

                                                {/* Plan Badge */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <Badge color={BRAND.indigo} tone="soft">
                                                        {tenant.plan || 'trial'}
                                                    </Badge>
                                                </td>

                                                {/* Status Badge */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <StatusBadge status={tenant.status || 'trial'} />
                                                </td>

                                                {/* Active Overrides Badges */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    {overrides.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                                            {overrides.map((o) => (
                                                                <span
                                                                    key={o.id}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 6,
                                                                        padding: '3px 10px',
                                                                        borderRadius: 999,
                                                                        fontSize: 11.5,
                                                                        fontWeight: 700,
                                                                        background: 'rgba(245, 158, 11, 0.12)',
                                                                        color: BRAND.amber,
                                                                        border: '1px solid rgba(245, 158, 11, 0.28)',
                                                                        lineHeight: 1.4,
                                                                    }}
                                                                >
                                                                    <span>
                                                                        {o.override_key}: <strong style={{ color: t.ink }}>{o.override_value ?? '∞'}</strong>
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeOverride(tenant.id, o.id);
                                                                        }}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: BRAND.amber,
                                                                            cursor: 'pointer',
                                                                            padding: 0,
                                                                            fontSize: 13,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            lineHeight: 1,
                                                                            opacity: 0.75,
                                                                        }}
                                                                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                                                                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; }}
                                                                        title="Remove override"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: t.muted, fontSize: 12.5 }}>No overrides</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            icon={Plus}
                                                            onClick={() => setDrawerTenant(tenant)}
                                                        >
                                                            Override
                                                        </Button>
                                                        <Link
                                                            href={route('platform.tenants.overrides.show', { tenant: tenant.id })}
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            <Button size="sm" variant="ghost">
                                                                Detail <ArrowRight size={13} style={{ marginLeft: 3 }} />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tenants?.last_page > 1 && (
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
                                Page {tenants.current_page} of {tenants.last_page} · {tenants.total} stores total
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={ChevronLeft}
                                    disabled={tenants.current_page <= 1}
                                    onClick={() => router.get(route('platform.tenants.overrides'), { search, page: tenants.current_page - 1 }, { preserveState: true })}
                                >
                                    Prev
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={tenants.current_page >= tenants.last_page}
                                    onClick={() => router.get(route('platform.tenants.overrides'), { search, page: tenants.current_page + 1 }, { preserveState: true })}
                                >
                                    Next <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </Panel>
            </div>

            {/* Override Drawer */}
            {drawerTenant && (
                <OverrideDrawer
                    open={!!drawerTenant}
                    tenant={drawerTenant}
                    availableKeys={[
                        'transactions_per_month',
                        'sku_limit',
                        'locations',
                        'staff_limit',
                        'woocommerce',
                        'api_access',
                        'growth_engine',
                        'multi_branch',
                        'reports',
                    ]}
                    onClose={() => setDrawerTenant(null)}
                />
            )}
        </OneGlanceLayout>
    );
}
