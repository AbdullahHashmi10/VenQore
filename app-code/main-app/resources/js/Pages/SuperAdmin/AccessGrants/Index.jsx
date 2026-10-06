import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, Button,
    Input, Drawer, Field, Select, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import {
    Gift, Plus, Copy, CheckCircle, Clock, Ban,
    RotateCcw, Trash2, X, Link as LinkIcon, ExternalLink
} from 'lucide-react';

function durationLabel(grant) {
    const unit = grant.duration_value === 1 ? grant.duration_unit : `${grant.duration_unit}s`;
    return `${grant.duration_value} ${unit.charAt(0).toUpperCase()}${unit.slice(1)}`;
}

function CopyLinkButton({ url, primary = false }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            size="sm"
            variant={primary ? 'primary' : 'secondary'}
            icon={copied ? CheckCircle : Copy}
            onClick={copy}
        >
            {copied ? 'Copied!' : 'Copy Link'}
        </Button>
    );
}

function NewGrantDrawer({ open, onClose, plans = [], onCreated }) {
    const t = useT();
    const { data, setData, post, processing, errors, reset } = useForm({
        plan_id: plans[0]?.id ?? '',
        duration_value: 1,
        duration_unit: 'year',
        label: '',
        max_redemptions: 1,
        expires_at: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.access-grants.store'), {
            onSuccess: () => {
                reset();
                onCreated?.();
                onClose();
            },
        });
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Create Gift Link"
            subtitle="Grant full store access to any plan for any duration — no payment required"
            width={520}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submit}
                        icon={Gift}
                        disabled={processing || !data.plan_id}
                    >
                        {processing ? 'Creating…' : 'Generate Gift Link'}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Plan to Grant" error={errors.plan_id}>
                    <Select
                        value={data.plan_id}
                        onChange={(e) => setData('plan_id', e.target.value)}
                        options={plans.map((p) => ({
                            value: p.id,
                            label: `${p.platform?.name ? `${p.platform.name} · ` : ''}${p.display_name || p.name}`,
                        }))}
                    />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                    <Field label="Duration Length" error={errors.duration_value}>
                        <Input
                            type="number"
                            min="1"
                            value={data.duration_value}
                            onChange={(e) => setData('duration_value', e.target.value)}
                        />
                    </Field>
                    <Field label="Duration Unit" error={errors.duration_unit}>
                        <Select
                            value={data.duration_unit}
                            onChange={(e) => setData('duration_unit', e.target.value)}
                            options={[
                                { value: 'day', label: 'Days' },
                                { value: 'month', label: 'Months' },
                                { value: 'year', label: 'Years' },
                            ]}
                        />
                    </Field>
                </div>

                <Field label="Internal Admin Note" hint="Private reference — never visible to the merchant" error={errors.label}>
                    <Input
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                        placeholder="e.g. VIP onboarding gift, partner pilot store"
                    />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Max Redemptions" hint="1 = single merchant link" error={errors.max_redemptions}>
                        <Input
                            type="number"
                            min="1"
                            value={data.max_redemptions}
                            onChange={(e) => setData('max_redemptions', e.target.value)}
                        />
                    </Field>
                    <Field label="Link Expiry Date" hint="Leave blank for perpetual" error={errors.expires_at}>
                        <Input
                            type="date"
                            value={data.expires_at}
                            onChange={(e) => setData('expires_at', e.target.value)}
                        />
                    </Field>
                </div>
            </form>
        </Drawer>
    );
}

export default function AccessGrantsIndex({ grants = [], plans = [] }) {
    const t = useT();
    const { flash } = usePage().props;
    const [showDrawer, setShowDrawer] = useState(false);
    const [newUrl, setNewUrl] = useState(flash?.new_grant_url ?? null);

    useEffect(() => {
        if (flash?.new_grant_url) setNewUrl(flash.new_grant_url);
    }, [flash?.new_grant_url]);

    const revoke = (grant) => {
        if (confirm(`Revoke this gift link${grant.label ? ` ("${grant.label}")` : ''}? It will stop working immediately.`)) {
            router.post(route('platform.access-grants.revoke', { grant: grant.id }), {}, { preserveScroll: true });
        }
    };

    const unrevoke = (grant) => {
        router.post(route('platform.access-grants.unrevoke', { grant: grant.id }), {}, { preserveScroll: true });
    };

    const destroy = (grant) => {
        if (confirm('Delete this unused gift link permanently?')) {
            router.delete(route('platform.access-grants.destroy', { grant: grant.id }), { preserveScroll: true });
        }
    };

    const stats = {
        total: grants.length,
        active: grants.filter((g) => !g.revoked_at && g.redemption_count < g.max_redemptions && (!g.expires_at || new Date(g.expires_at) > new Date())).length,
        redeemed: grants.reduce((s, g) => s + (g.redemption_count || 0), 0),
        revoked: grants.filter((g) => g.revoked_at).length,
    };

    return (
        <OneGlanceLayout title="Gift Access Links" mode="admin" activeMenu="Gift Links">
            <Head title="Platform HQ | Gift Access Links" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <PageHeader
                    icon={Gift}
                    accent={BRAND.indigo}
                    title="Gift Access Links"
                    subtitle="Generate promotional links granting any plan for any duration — zero payment gateway required."
                    actions={
                        <Button variant="primary" icon={Plus} onClick={() => setShowDrawer(true)}>
                            New Gift Link
                        </Button>
                    }
                />

                {/* Just created URL banner */}
                {newUrl && (
                    <Panel pad={18} style={{
                        background: 'rgba(16, 185, 129, 0.10)',
                        border: '1px solid rgba(16, 185, 129, 0.30)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <CheckCircle size={22} style={{ color: BRAND.emerald, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: BRAND.emerald }}>
                                    Gift Link Created Successfully
                                </div>
                                <div style={{ fontSize: 12, color: t.ink, fontFamily: 'monospace', wordBreak: 'break-all', marginTop: 2 }}>
                                    {newUrl}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CopyLinkButton url={newUrl} primary />
                            <button
                                type="button"
                                onClick={() => setNewUrl(null)}
                                style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 6 }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </Panel>
                )}

                {/* KPI Stats Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Links
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {stats.total}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Issued across campaigns</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Active Links
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.emerald, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {stats.active}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Available for claim</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Redeemed Stores
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.indigo, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {stats.redeemed}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Activated by users</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Revoked
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.rose, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {stats.revoked}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Disabled manually</div>
                    </Panel>
                </div>

                {/* Grants Table */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                            <thead>
                                <tr>
                                    {['Plan & Duration', 'Admin Note', 'Status', 'Usage', 'Created', 'Actions'].map((h, idx) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 18px',
                                                textAlign: idx === 5 ? 'right' : 'left',
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
                                {grants.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                            <EmptyState
                                                icon={Gift}
                                                title="No gift links yet"
                                                message="Generate a link above to gift a free trial, influencer tier, or lifetime access to any customer."
                                                action={
                                                    <Button variant="primary" icon={Plus} onClick={() => setShowDrawer(true)}>
                                                        Generate First Link
                                                    </Button>
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    grants.map((grant) => {
                                        const isRevoked = !!grant.revoked_at;
                                        const isExpired = grant.expires_at && new Date(grant.expires_at) < new Date() && grant.redemption_count === 0;
                                        const isFullyRedeemed = grant.redemption_count >= grant.max_redemptions;
                                        const linkUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/gift/${grant.token}`;

                                        return (
                                            <tr
                                                key={grant.id}
                                                className="vq-row"
                                                style={{ borderBottom: `1px solid ${t.rowBorder}` }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                {/* Plan & Duration */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    <div style={{ fontWeight: 800, color: t.ink, fontSize: 14 }}>
                                                        {grant.plan?.display_name || grant.plan?.name || 'Standard Tier'}
                                                    </div>
                                                    <div style={{ fontSize: 11.5, color: BRAND.indigo, fontWeight: 700, marginTop: 2 }}>
                                                        {durationLabel(grant)}
                                                    </div>
                                                </td>

                                                {/* Note */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.sub, fontSize: 13 }}>
                                                    {grant.label || <span style={{ color: t.faint }}>—</span>}
                                                </td>

                                                {/* Status */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                                                    {isRevoked ? (
                                                        <Badge color={BRAND.rose} tone="soft">Revoked</Badge>
                                                    ) : isExpired ? (
                                                        <Badge color={BRAND.amber} tone="soft">Expired</Badge>
                                                    ) : isFullyRedeemed ? (
                                                        <Badge color={BRAND.slate} tone="soft">Redeemed</Badge>
                                                    ) : (
                                                        <Badge color={BRAND.emerald} tone="soft">Active</Badge>
                                                    )}
                                                </td>

                                                {/* Usage */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.sub, fontSize: 13, fontFamily: 'monospace' }}>
                                                    <strong style={{ color: t.ink }}>{grant.redemption_count}</strong> / {grant.max_redemptions}
                                                </td>

                                                {/* Created */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.muted, fontSize: 12 }}>
                                                    {new Date(grant.created_at).toLocaleDateString()}
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                                        <CopyLinkButton url={linkUrl} />

                                                        {isRevoked ? (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                icon={RotateCcw}
                                                                onClick={() => unrevoke(grant)}
                                                                title="Re-activate link"
                                                            >
                                                                Reactivate
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                icon={Ban}
                                                                onClick={() => revoke(grant)}
                                                                title="Revoke link"
                                                                style={{ color: BRAND.amber }}
                                                            >
                                                                Revoke
                                                            </Button>
                                                        )}

                                                        {grant.redemption_count === 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                icon={Trash2}
                                                                onClick={() => destroy(grant)}
                                                                title="Delete unused link"
                                                                style={{ color: BRAND.rose }}
                                                            />
                                                        )}
                                                    </div>
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

            <NewGrantDrawer
                open={showDrawer}
                onClose={() => setShowDrawer(false)}
                plans={plans}
            />
        </OneGlanceLayout>
    );
}
