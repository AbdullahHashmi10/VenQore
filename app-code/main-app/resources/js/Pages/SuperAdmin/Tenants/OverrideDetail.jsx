import React, { useState, useMemo } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, StatusBadge, Button,
    Input, Field, Select, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import {
    ArrowLeft, Zap, RotateCcw, Clock, CheckCircle, Edit2, X,
    Save, Info, User, Mail, Building2, Calendar, Globe, DollarSign,
    Package, Users, ShoppingCart, Shield, ChevronDown, AlertTriangle,
    Hash, Tag, Plus, Minus, Sparkles, Gift, Layers, Search,
    AlertCircle, RefreshCw, Check, ArrowUpRight
} from 'lucide-react';

// ── V6 Inline Toggle ──────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
    const t = useT();
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            style={{
                width: 44,
                height: 24,
                borderRadius: 999,
                padding: 2,
                border: 'none',
                background: value ? BRAND.indigo : t.inputBg,
                outline: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    width: 20,
                    height: 20,
                    background: '#fff',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transform: value ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
            />
        </button>
    );
}

// ── Field Row (label + editable value) ─────────────────────────────────────────
function FieldRow({ label, icon: Icon, children }) {
    const t = useT();
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 0',
            borderBottom: `1px solid ${t.rowBorder}`,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: 190,
                flexShrink: 0,
            }}>
                {Icon && <Icon size={14} style={{ color: t.muted, flexShrink: 0 }} />}
                <span style={{ fontSize: 11.5, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {children}
            </div>
        </div>
    );
}

function EditableText({ value, onChange, placeholder, type = 'text' }) {
    return (
        <Input
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    );
}

function EditableSelect({ value, onChange, options }) {
    return (
        <Select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            options={options}
        />
    );
}

// ── Helper to check if a value drops below base plan ──────────────────────────
function checkIsBelowPlan(overrideVal, planDef) {
    if (overrideVal === null || overrideVal === undefined || overrideVal === '') return false;
    if (planDef === null || planDef === undefined || planDef === '') return false;

    // Numeric comparison
    const numOverride = Number(overrideVal);
    const numPlan = Number(planDef);
    if (!isNaN(numOverride) && !isNaN(numPlan)) {
        return numOverride < numPlan;
    }

    // Boolean comparison: plan has it enabled ('1'), but override disabled ('0')
    const isPlanEnabled = planDef === '1' || planDef === true || planDef === 1;
    const isOverrideDisabled = overrideVal === '0' || overrideVal === false || overrideVal === 0;
    if (isPlanEnabled && isOverrideDisabled) {
        return true;
    }

    return false;
}

// ── Limit Card with Steppers & Real-time Warnings ─────────────────────────────
function LimitCard({ limitKey, info, tenant }) {
    const t = useT();
    const [editing, setEditing] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        override_key: limitKey,
        override_value: info.override ?? '',
        reason: info.reason ?? '',
        expires_at: info.expires_at ? info.expires_at.substring(0, 16) : '',
        notify_user: false,
        notification_message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.tenants.overrides.apply', { tenant: tenant.id }), {
            preserveScroll: true,
            onSuccess: () => { reset(); setEditing(false); },
        });
    };

    const removeOverride = () => {
        if (info.override_id && confirm('Remove this override? Tenant will revert to the plan default value.')) {
            router.delete(route('platform.tenants.overrides.remove', { tenant: tenant.id, override: info.override_id }), {
                preserveScroll: true,
            });
        }
    };

    const hasOverride = info.override !== null && info.override !== undefined && info.override !== '';
    const isCurrentlyBelow = info.is_below;
    const displayValue = info.effective === null ? '∞' : String(info.effective);

    // Real-time below plan level detection during edit
    const isBelowWarning = useMemo(() => {
        return checkIsBelowPlan(data.override_value, info.plan_default);
    }, [data.override_value, info.plan_default]);

    // LTD SKU Warning check (F15)
    const isLtdSkuWarning = tenant.plan?.startsWith('ltd') && limitKey === 'sku_limit';

    // Stepper adjustments
    const adjustValue = (delta) => {
        const current = data.override_value === '' || data.override_value === null
            ? (Number(info.plan_default) || 0)
            : Number(data.override_value);
        if (!isNaN(current)) {
            const next = Math.max(0, current + delta);
            setData('override_value', String(next));
        }
    };

    return (
        <div style={{
            borderRadius: 16,
            padding: 16,
            border: hasOverride
                ? (isCurrentlyBelow ? `1px solid ${BRAND.amber}66` : `1px solid ${BRAND.indigo}66`)
                : `1px solid ${t.border}`,
            background: hasOverride
                ? (isCurrentlyBelow ? `${BRAND.amber}10` : `${BRAND.indigo}0c`)
                : t.panel,
            boxShadow: t.isDark ? 'none' : 'var(--vq-elev-1)',
            transition: 'all 0.2s',
        }}>
            {/* Header & Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <span style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: t.ink,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }} title={limitKey}>
                    {limitKey}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {hasOverride ? (
                        <>
                            {isCurrentlyBelow ? (
                                <Badge color={BRAND.amber} tone="soft">
                                    <AlertTriangle size={10} style={{ marginRight: 3 }} /> Below Plan
                                </Badge>
                            ) : (
                                <Badge color={BRAND.indigo} tone="soft">
                                    <Zap size={10} style={{ marginRight: 3 }} /> Override
                                </Badge>
                            )}
                            <button
                                type="button"
                                onClick={removeOverride}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: BRAND.rose,
                                    cursor: 'pointer',
                                    padding: 4,
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                title="Revert to plan default"
                            >
                                <RotateCcw size={12} />
                            </button>
                        </>
                    ) : (
                        <Badge color={BRAND.slate} tone="soft">
                            <CheckCircle size={10} style={{ marginRight: 3 }} /> Plan Default
                        </Badge>
                    )}
                </div>
            </div>

            {!editing ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: t.ink, letterSpacing: '-0.02em' }}>
                            {displayValue}
                        </div>
                        {hasOverride && (
                            <div style={{ fontSize: 11.5, color: t.muted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>Base default:</span>
                                <span style={{ fontFamily: 'monospace', color: t.sub, fontWeight: 700 }}>
                                    {info.plan_default === null ? '∞' : String(info.plan_default)}
                                </span>
                            </div>
                        )}
                        {info.reason && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: t.muted, fontStyle: 'italic' }}>{info.reason}</p>}
                        {info.expires_at && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: BRAND.amber, marginTop: 4, fontWeight: 600 }}>
                                <Clock size={11} /> Expires {new Date(info.expires_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        icon={Edit2}
                        onClick={() => {
                            setData('override_value', info.override !== null && info.override !== undefined ? String(info.override) : (info.plan_default !== null ? String(info.plan_default) : ''));
                            setEditing(true);
                        }}
                    >
                        Adjust
                    </Button>
                </div>
            ) : (
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                    {/* Stepper & Input */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: t.muted, marginBottom: 4 }}>
                            <span>Override Value (blank = unlimited)</span>
                            <span style={{ fontFamily: 'monospace' }}>
                                Base: {info.plan_default === null ? '∞' : String(info.plan_default)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Button type="button" size="sm" variant="secondary" onClick={() => adjustValue(-10)}>-10</Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => adjustValue(-1)}>-1</Button>
                            <Input
                                value={data.override_value}
                                onChange={(e) => setData('override_value', e.target.value)}
                                placeholder="Value (blank = ∞)"
                                style={{ flex: 1, textAlign: 'center', fontFamily: 'monospace' }}
                            />
                            <Button type="button" size="sm" variant="secondary" onClick={() => adjustValue(1)}>+1</Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => adjustValue(10)}>+10</Button>
                        </div>
                    </div>

                    {/* Quick Boolean buttons if key represents a boolean feature */}
                    {(info.plan_default === '0' || info.plan_default === '1' || info.plan_default === false || info.plan_default === true) && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                                type="button"
                                size="sm"
                                variant={data.override_value === '1' ? 'success' : 'secondary'}
                                onClick={() => setData('override_value', '1')}
                                style={{ flex: 1 }}
                            >
                                ✓ Enabled (1)
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={data.override_value === '0' ? 'danger' : 'secondary'}
                                onClick={() => setData('override_value', '0')}
                                style={{ flex: 1 }}
                            >
                                ✕ Disabled (0)
                            </Button>
                        </div>
                    )}

                    {/* Real-time Below Plan Level Warning Banner */}
                    {isBelowWarning && (
                        <div style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: t.ink,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                        }}>
                            <AlertTriangle size={15} style={{ color: BRAND.amber, flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <strong style={{ color: BRAND.amber }}>Warning: Below Base Plan Level!</strong>
                                <p style={{ margin: '3px 0 0', color: t.sub }}>
                                    You entered <strong style={{ color: t.ink, fontFamily: 'monospace' }}>{data.override_value}</strong>, which is lower than the tenant's base plan default (<strong style={{ color: t.ink, fontFamily: 'monospace' }}>{info.plan_default ?? '∞'}</strong>).
                                </p>
                            </div>
                        </div>
                    )}

                    {/* LTD Warning Banner (F15) */}
                    {isLtdSkuWarning && (
                        <div style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: `${BRAND.indigo}12`,
                            border: `1px solid ${BRAND.indigo}33`,
                            color: t.ink,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                        }}>
                            <AlertCircle size={15} style={{ color: BRAND.indigo, flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <strong style={{ color: BRAND.indigo }}>LTD Tier Notice:</strong> SKU limit is an anchor for LTD classification.
                            </div>
                        </div>
                    )}

                    <Input
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        placeholder="Reason (e.g. VIP loyalty upgrade, promo, support ticket)"
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} style={{ color: t.muted, flexShrink: 0 }} />
                        <Input
                            type="datetime-local"
                            value={data.expires_at}
                            onChange={(e) => setData('expires_at', e.target.value)}
                            title="Optional Expiry Date"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            icon={Save}
                            disabled={processing}
                            style={{ flex: 1 }}
                        >
                            {processing ? 'Saving…' : 'Save Override'}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => { setEditing(false); reset(); }}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function OverrideDetail({
    tenant,
    effective_limits,
    override_history,
    available_keys,
    available_keys_metadata,
    plans,
    addons_catalogue,
    active_addons
}) {
    const t = useT();
    const { flash } = usePage().props;

    // Tenant Profile Form
    const { data, setData, patch, processing, errors } = useForm({
        name:                  tenant.name ?? '',
        plan:                  tenant.plan ?? 'trial',
        status:                tenant.status ?? 'trial',
        trial_ends_at:         tenant.trial_ends_at ? tenant.trial_ends_at.substring(0, 10) : '',
        subscription_ends_at:  tenant.subscription_ends_at ? tenant.subscription_ends_at.substring(0, 10) : '',
        timezone:              tenant.timezone ?? '',
        currency_code:         tenant.currency_code ?? '',
        currency_symbol:       tenant.currency_symbol ?? '',
        industry:              tenant.industry ?? '',
        feature_variants:      !!tenant.feature_variants,
        feature_serials:       !!tenant.feature_serials,
        feature_batches:       !!tenant.feature_batches,
        feature_manufacturing: !!tenant.feature_manufacturing,
    });

    const saveProfile = (e) => {
        e.preventDefault();
        patch(route('platform.tenants.overrides.update', { tenant: tenant.id }), {
            preserveScroll: true,
        });
    };

    // Custom Key Override Creator State (F12, F13)
    const [selectedKey, setSelectedKey] = useState('');
    const [keySearch, setKeySearch] = useState('');
    const [customValue, setCustomValue] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [customExpiry, setCustomExpiry] = useState('');
    const [submittingCustom, setSubmittingCustom] = useState(false);

    // Filter canonical keys for quick selector
    const filteredAvailableKeys = useMemo(() => {
        if (!keySearch.trim()) return (available_keys || []).slice(0, 30);
        const q = keySearch.toLowerCase();
        return (available_keys || []).filter((k) => k.toLowerCase().includes(q)).slice(0, 30);
    }, [available_keys, keySearch]);

    // Selected key metadata
    const selectedKeyMeta = useMemo(() => {
        if (!selectedKey || !available_keys_metadata) return null;
        return available_keys_metadata[selectedKey] || null;
    }, [selectedKey, available_keys_metadata]);

    // Real-time below plan warning for custom override
    const customIsBelowWarning = useMemo(() => {
        if (!selectedKeyMeta) return false;
        return checkIsBelowPlan(customValue, selectedKeyMeta.plan_default);
    }, [customValue, selectedKeyMeta]);

    const handleApplyCustomOverride = (e) => {
        e.preventDefault();
        if (!selectedKey) return;
        setSubmittingCustom(true);
        router.post(
            route('platform.tenants.overrides.apply', { tenant: tenant.id }),
            {
                override_key: selectedKey,
                override_value: customValue,
                reason: customReason || 'Manual platform override',
                expires_at: customExpiry || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedKey('');
                    setCustomValue('');
                    setCustomReason('');
                    setCustomExpiry('');
                },
                onFinish: () => setSubmittingCustom(false),
            }
        );
    };

    // Add-on Grant Form State (F8)
    const [addonSlug, setAddonSlug] = useState('');
    const [addonQty, setAddonQty] = useState(1);
    const [addonExpiry, setAddonExpiry] = useState('');
    const [addonReason, setAddonReason] = useState('');
    const [submittingAddon, setSubmittingAddon] = useState(false);
    const [revokingReason, setRevokingReason] = useState(null);

    const selectedAddonDetails = useMemo(() => {
        if (!addonSlug || !addons_catalogue) return null;
        return addons_catalogue[addonSlug] || null;
    }, [addonSlug, addons_catalogue]);

    const handleGrantAddon = (e) => {
        e.preventDefault();
        if (!addonSlug) return;
        setSubmittingAddon(true);
        router.post(
            route('platform.tenants.overrides.grant-addon', { tenant: tenant.id }),
            {
                addon_slug: addonSlug,
                quantity: addonQty,
                expires_at: addonExpiry || null,
                reason: addonReason || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddonSlug('');
                    setAddonQty(1);
                    setAddonExpiry('');
                    setAddonReason('');
                },
                onFinish: () => setSubmittingAddon(false),
            }
        );
    };

    const handleRevokeAddon = (reasonPrefix) => {
        if (confirm(`Revoke all overrides tagged "${reasonPrefix}"? Tenant limits will revert to base plan level.`)) {
            setRevokingReason(reasonPrefix);
            router.post(
                route('platform.tenants.overrides.revoke-addon', { tenant: tenant.id }),
                { reason_prefix: reasonPrefix },
                {
                    preserveScroll: true,
                    onFinish: () => setRevokingReason(null),
                }
            );
        }
    };

    // Dynamic Plan Options (F1)
    const planOptions = useMemo(() => {
        const list = (plans || []).map((p) => ({
            value: p.slug,
            label: p.display_name || p.name || p.slug,
        }));
        const hasCurrent = list.some((o) => o.value === tenant.plan);
        if (!hasCurrent && tenant.plan) {
            list.unshift({
                value: tenant.plan,
                label: `${tenant.plan.toUpperCase()} (Legacy)`,
            });
        }
        return list;
    }, [plans, tenant.plan]);

    const statusOptions = [
        { value: 'trial', label: 'Trial' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    // Count below plan overrides
    const belowPlanCount = Object.values(effective_limits || {}).filter((info) => info.is_below).length;

    return (
        <OneGlanceLayout title={`Store — ${tenant.name}`} mode="admin" activeMenu="Tenant Overrides">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header with back link */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 8 }}>
                        <Link
                            href={route('platform.tenants.overrides')}
                            style={{ color: BRAND.indigo, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <ArrowLeft size={14} /> Tenant Overrides
                        </Link>
                        <span>/</span>
                        <span style={{ fontFamily: 'monospace', color: t.sub }}>{tenant.slug}</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: t.ink, letterSpacing: '-0.025em' }}>
                                {tenant.name}
                            </h1>
                            <StatusBadge status={tenant.status || 'trial'} />
                            <Badge color={BRAND.indigo} tone="soft">{tenant.plan || 'trial'}</Badge>
                        </div>

                        {belowPlanCount > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 14px',
                                borderRadius: 12,
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                color: BRAND.amber,
                                fontSize: 12.5,
                                fontWeight: 800,
                            }}>
                                <AlertTriangle size={16} />
                                <span>{belowPlanCount} limit{belowPlanCount > 1 ? 's are' : ' is'} set BELOW base plan!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                {flash?.success && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: 14,
                        borderRadius: 14, background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)', color: BRAND.emerald,
                        fontSize: 13, fontWeight: 700,
                    }}>
                        <CheckCircle size={18} /> {flash.success}
                    </div>
                )}

                {/* Main 2-column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 1fr)', gap: 24, alignItems: 'start' }}>
                    {/* LEFT COLUMN: Profile & Add-on Management */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* 1. Add-on Packs Panel */}
                        <Panel pad={20}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: `${BRAND.indigo}18`, color: BRAND.indigo,
                                        display: 'grid', placeItems: 'center',
                                    }}>
                                        <Gift size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.ink }}>Add-on Packs & Entitlements</h3>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>Grant bundled feature packages in one click</p>
                                    </div>
                                </div>
                                <Badge color={BRAND.indigo} tone="soft">Universal Add-ons</Badge>
                            </div>

                            {/* Grant form */}
                            <form onSubmit={handleGrantAddon} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 14 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
                                    <Field label="Add-on Product">
                                        <Select
                                            value={addonSlug}
                                            onChange={(e) => setAddonSlug(e.target.value)}
                                            options={[
                                                { value: '', label: '-- Choose Add-on Package --' },
                                                ...Object.entries(addons_catalogue || {}).map(([slug, details]) => ({
                                                    value: slug,
                                                    label: `${details.name} (${details.price_formatted || `$${details.price}/mo`})`,
                                                })),
                                            ]}
                                        />
                                    </Field>
                                    <Field label="Quantity">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={addonQty}
                                            onChange={(e) => setAddonQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            style={{ textAlign: 'center', fontFamily: 'monospace' }}
                                        />
                                    </Field>
                                </div>

                                {selectedAddonDetails && (
                                    <div style={{
                                        padding: 10,
                                        borderRadius: 10,
                                        background: `${BRAND.indigo}0f`,
                                        border: `1px solid ${BRAND.indigo}22`,
                                        fontSize: 12,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: BRAND.indigo, fontWeight: 800 }}>
                                            <span>{selectedAddonDetails.name} × {addonQty}</span>
                                            <span>Unlocks {Object.keys(selectedAddonDetails.entitlements || {}).length} entitlement(s)</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                            {Object.entries(selectedAddonDetails.entitlements || {}).map(([k, v]) => (
                                                <span key={k} style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: 11,
                                                    background: t.panelSolid,
                                                    color: t.ink,
                                                    padding: '2px 8px',
                                                    borderRadius: 6,
                                                    border: `1px solid ${t.border}`,
                                                }}>
                                                    {k.startsWith('+') ? `${k} (+${Number(v) * addonQty})` : `${k} = ${v}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <Field label="Optional Expiry">
                                        <Input
                                            type="datetime-local"
                                            value={addonExpiry}
                                            onChange={(e) => setAddonExpiry(e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Custom Note">
                                        <Input
                                            value={addonReason}
                                            onChange={(e) => setAddonReason(e.target.value)}
                                            placeholder={`Default: add-on: ${addonSlug || '...'} x${addonQty}`}
                                        />
                                    </Field>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    icon={Plus}
                                    disabled={!addonSlug || submittingAddon}
                                >
                                    {submittingAddon ? 'Applying Add-on…' : `Grant ${selectedAddonDetails ? selectedAddonDetails.name : 'Add-on'} Pack`}
                                </Button>
                            </form>

                            {/* Active Add-on packs */}
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
                                <div style={{ fontSize: 11.5, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                    Active Add-on Packages ({active_addons?.length || 0})
                                </div>
                                {(!active_addons || active_addons.length === 0) ? (
                                    <div style={{ fontSize: 12.5, color: t.muted, fontStyle: 'italic' }}>
                                        No add-on packs currently assigned to this store.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {active_addons.map((pack) => (
                                            <div
                                                key={pack.reason}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 14px',
                                                    borderRadius: 12,
                                                    background: t.panel2,
                                                    border: `1px solid ${t.border}`,
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: 'monospace', color: BRAND.indigo }}>
                                                            {pack.reason}
                                                        </span>
                                                        {pack.expires_at && (
                                                            <Badge color={BRAND.amber} tone="soft">
                                                                Expires {new Date(pack.expires_at).toLocaleDateString()}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                                        {pack.keys.map((k) => (
                                                            <span key={k.id} style={{ fontSize: 11, fontFamily: 'monospace', color: t.sub }}>
                                                                {k.key}: <strong style={{ color: t.ink }}>{k.value ?? '∞'}</strong>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={revokingReason === pack.reason}
                                                    onClick={() => handleRevokeAddon(pack.reason)}
                                                >
                                                    {revokingReason === pack.reason ? 'Revoking…' : 'Revoke'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Panel>

                        {/* 2. Store Profile & Configuration */}
                        <Panel pad={20}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${t.border}` }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: `${BRAND.sky}18`, color: BRAND.sky,
                                    display: 'grid', placeItems: 'center',
                                }}>
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.ink }}>Store Profile & Plan Assignment</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>Switch plans, adjust subscription dates, and toggle store capabilities</p>
                                </div>
                            </div>

                            <form onSubmit={saveProfile}>
                                <FieldRow label="Store Name" icon={Building2}>
                                    <EditableText value={data.name} onChange={(v) => setData('name', v)} placeholder="Store name" />
                                </FieldRow>
                                <FieldRow label="Store Owner" icon={User}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: t.ink, fontSize: 13.5 }}>{tenant.owner_name}</div>
                                        <div style={{ fontSize: 12, color: t.muted }}>{tenant.owner_email}</div>
                                    </div>
                                </FieldRow>
                                <FieldRow label="Store Slug" icon={Tag}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontFamily: 'monospace' }}>
                                        <span style={{ color: BRAND.indigo, fontWeight: 800 }}>#{tenant.id}</span>
                                        <span style={{ color: t.sub }}>{tenant.slug}</span>
                                    </div>
                                </FieldRow>
                                <FieldRow label="Industry" icon={Package}>
                                    <EditableText value={data.industry} onChange={(v) => setData('industry', v)} placeholder="e.g. Retail, Fashion, Cafe" />
                                </FieldRow>

                                {/* Plan & Billing */}
                                <div style={{ padding: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Shield size={14} style={{ color: BRAND.indigo }} />
                                    <span style={{ fontSize: 11.5, fontWeight: 800, color: BRAND.indigo, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Plan & Billing Tier
                                    </span>
                                </div>
                                <FieldRow label="Assigned Plan" icon={Shield}>
                                    <EditableSelect value={data.plan} onChange={(v) => setData('plan', v)} options={planOptions} />
                                </FieldRow>
                                <FieldRow label="Account Status" icon={CheckCircle}>
                                    <EditableSelect value={data.status} onChange={(v) => setData('status', v)} options={statusOptions} />
                                </FieldRow>
                                <FieldRow label="Trial End Date" icon={Calendar}>
                                    <EditableText type="date" value={data.trial_ends_at} onChange={(v) => setData('trial_ends_at', v)} />
                                </FieldRow>
                                <FieldRow label="Subscription End" icon={Calendar}>
                                    <EditableText type="date" value={data.subscription_ends_at} onChange={(v) => setData('subscription_ends_at', v)} />
                                </FieldRow>

                                {/* Feature Toggles */}
                                <div style={{ padding: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Zap size={14} style={{ color: BRAND.amber }} />
                                    <span style={{ fontSize: 11.5, fontWeight: 800, color: BRAND.amber, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Inventory Modules
                                    </span>
                                </div>
                                {[
                                    { key: 'feature_variants', label: 'Product Variants' },
                                    { key: 'feature_serials', label: 'Serial Number Tracking' },
                                    { key: 'feature_batches', label: 'Batch & Expiry Tracking' },
                                    { key: 'feature_manufacturing', label: 'Manufacturing & Recipes' },
                                ].map(({ key, label }) => (
                                    <FieldRow key={key} label={label}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Toggle value={data[key]} onChange={(v) => setData(key, v)} />
                                            <span style={{ fontSize: 12.5, fontWeight: 700, color: data[key] ? BRAND.emerald : t.muted }}>
                                                {data[key] ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </FieldRow>
                                ))}

                                <div style={{ paddingTop: 18, marginTop: 14, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        icon={Save}
                                        disabled={processing}
                                    >
                                        {processing ? 'Saving Changes…' : 'Save Store Profile'}
                                    </Button>
                                </div>
                            </form>
                        </Panel>

                        {/* 3. Override History & Audit Log */}
                        <Panel pad={20}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Clock size={16} style={{ color: t.muted }} />
                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: t.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Override History & Audit Log
                                    </h3>
                                </div>
                                <span style={{ fontSize: 12, fontFamily: 'monospace', color: t.muted }}>
                                    {override_history?.length || 0} events
                                </span>
                            </div>

                            {(!override_history || override_history.length === 0) ? (
                                <div style={{ fontSize: 12.5, color: t.muted, fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                                    No overrides recorded yet.
                                </div>
                            ) : (
                                <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: 'left', color: t.muted, fontWeight: 800 }}>
                                                <th style={{ padding: '8px 10px' }}>Key</th>
                                                <th style={{ padding: '8px 10px' }}>Value</th>
                                                <th style={{ padding: '8px 10px' }}>Original</th>
                                                <th style={{ padding: '8px 10px' }}>Reason</th>
                                                <th style={{ padding: '8px 10px' }}>Status</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {override_history.map((o) => {
                                                const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
                                                return (
                                                    <tr key={o.id} style={{ borderBottom: `1px solid ${t.rowBorder}`, opacity: isExpired ? 0.5 : 1 }}>
                                                        <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontWeight: 800, color: BRAND.indigo }}>
                                                            {o.override_key}
                                                        </td>
                                                        <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontWeight: 800, color: t.ink }}>
                                                            {o.override_value ?? '∞'}
                                                        </td>
                                                        <td style={{ padding: '10px 10px', fontFamily: 'monospace', color: t.muted }}>
                                                            {o.original_value ?? '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 10px', color: t.sub }}>
                                                            {o.reason || '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 10px' }}>
                                                            {isExpired ? (
                                                                <Badge color={BRAND.rose} tone="soft">Expired</Badge>
                                                            ) : o.expires_at ? (
                                                                <Badge color={BRAND.amber} tone="soft">Till {new Date(o.expires_at).toLocaleDateString()}</Badge>
                                                            ) : (
                                                                <Badge color={BRAND.emerald} tone="soft">Active</Badge>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                                                            {!isExpired && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        if (confirm(`Revert ${o.override_key} override?`)) {
                                                                            router.delete(route('platform.tenants.overrides.remove', { tenant: tenant.id, override: o.id }));
                                                                        }
                                                                    }}
                                                                    style={{ color: BRAND.rose }}
                                                                >
                                                                    Revert
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Panel>
                    </div>

                    {/* RIGHT COLUMN: Quick Override & Limit Matrix */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Live Metrics Summary */}
                        <Panel pad={16}>
                            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted, marginBottom: 12 }}>
                                Live Store Metrics
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                {[
                                    { label: 'Staff', value: tenant.staff_count ?? 0, icon: Users, color: BRAND.sky },
                                    { label: 'Products', value: tenant.product_count ?? 0, icon: Package, color: BRAND.emerald },
                                    { label: 'Sales', value: tenant.sales_count ?? 0, icon: ShoppingCart, color: BRAND.amber },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} style={{
                                        background: t.panel2,
                                        borderRadius: 12,
                                        padding: 12,
                                        textAlign: 'center',
                                        border: `1px solid ${t.border}`,
                                    }}>
                                        <Icon size={16} style={{ color, margin: '0 auto 4px' }} />
                                        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: t.ink }}>
                                            {value}
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.muted, marginTop: 2 }}>
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>

                        {/* Quick Arbitrary Key Override Creator */}
                        <Panel pad={20}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Sparkles size={16} style={{ color: BRAND.indigo }} />
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: t.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Grant Capability Override
                                </h3>
                            </div>
                            <p style={{ margin: '0 0 14px', fontSize: 12, color: t.muted }}>
                                Grant any canonical feature or system limit directly to this store.
                            </p>

                            <form onSubmit={handleApplyCustomOverride} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
                                    <Input
                                        value={keySearch}
                                        onChange={(e) => setKeySearch(e.target.value)}
                                        placeholder="Search canonical keys (e.g. multi_branch, sku_limit)…"
                                        style={{ paddingLeft: 34, fontSize: 12.5 }}
                                    />
                                </div>

                                <Select
                                    value={selectedKey}
                                    onChange={(e) => {
                                        const k = e.target.value;
                                        setSelectedKey(k);
                                        const meta = available_keys_metadata?.[k];
                                        if (meta && meta.plan_default !== null) {
                                            setCustomValue(String(meta.plan_default));
                                        } else {
                                            setCustomValue('');
                                        }
                                    }}
                                    options={[
                                        { value: '', label: `-- Choose Key (${filteredAvailableKeys.length} matching) --` },
                                        ...filteredAvailableKeys.map((k) => {
                                            const meta = available_keys_metadata?.[k];
                                            const defStr = meta?.plan_default === null ? '∞' : (meta?.plan_default ?? 'not in plan');
                                            return { value: k, label: `${k} (Base: ${defStr})` };
                                        }),
                                    ]}
                                />

                                {selectedKey && (
                                    <div style={{
                                        padding: 12,
                                        borderRadius: 12,
                                        background: t.panel2,
                                        border: `1px solid ${t.border}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: BRAND.indigo }}>{selectedKey}</span>
                                            <span style={{ color: t.muted }}>
                                                Base default: <strong style={{ color: t.ink, fontFamily: 'monospace' }}>{selectedKeyMeta?.plan_default ?? 'None'}</strong>
                                            </span>
                                        </div>

                                        {/* Steppers */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Button type="button" size="sm" variant="secondary" onClick={() => setCustomValue(String(Math.max(0, (Number(customValue) || 0) - 1)))}>-1</Button>
                                            <Input
                                                value={customValue}
                                                onChange={(e) => setCustomValue(e.target.value)}
                                                placeholder="Value (blank = ∞)"
                                                style={{ flex: 1, textAlign: 'center', fontFamily: 'monospace' }}
                                            />
                                            <Button type="button" size="sm" variant="secondary" onClick={() => setCustomValue(String((Number(customValue) || 0) + 1))}>+1</Button>
                                            <Button type="button" size="sm" variant="secondary" onClick={() => setCustomValue(String((Number(customValue) || 0) + 10))}>+10</Button>
                                        </div>

                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Button type="button" size="sm" variant="success" onClick={() => setCustomValue('1')} style={{ flex: 1 }}>
                                                ✓ Enable (1)
                                            </Button>
                                            <Button type="button" size="sm" variant="danger" onClick={() => setCustomValue('0')} style={{ flex: 1 }}>
                                                ✕ Disable (0)
                                            </Button>
                                        </div>

                                        {customIsBelowWarning && (
                                            <div style={{
                                                padding: '8px 10px',
                                                borderRadius: 10,
                                                background: 'rgba(245, 158, 11, 0.12)',
                                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                                color: t.ink,
                                                fontSize: 11.5,
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 6,
                                            }}>
                                                <AlertTriangle size={14} style={{ color: BRAND.amber, flexShrink: 0, marginTop: 1 }} />
                                                <span>Value <strong>{customValue}</strong> is lower than base plan default ({selectedKeyMeta?.plan_default ?? '∞'}).</span>
                                            </div>
                                        )}

                                        <Input
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            placeholder="Reason for granting this override"
                                        />

                                        <Input
                                            type="datetime-local"
                                            value={customExpiry}
                                            onChange={(e) => setCustomExpiry(e.target.value)}
                                            title="Optional Expiry Date"
                                        />

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            icon={Zap}
                                            disabled={submittingCustom}
                                        >
                                            {submittingCustom ? 'Applying…' : `Apply Override for ${selectedKey}`}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </Panel>

                        {/* Effective Limits Cards Matrix */}
                        <Panel pad={0} style={{ overflow: 'hidden' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 18px',
                                borderBottom: `1px solid ${t.border}`,
                                background: t.panel2,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Zap size={16} style={{ color: BRAND.indigo }} />
                                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: t.ink, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Effective Plan Limits
                                    </h3>
                                </div>
                                <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: t.muted }}>
                                    {Object.keys(effective_limits || {}).length} rules
                                </span>
                            </div>

                            <div className="vq-scroll" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 800, overflowY: 'auto' }}>
                                {Object.entries(effective_limits || {}).map(([key, info]) => (
                                    <LimitCard
                                        key={key}
                                        limitKey={key}
                                        info={info}
                                        tenant={tenant}
                                    />
                                ))}
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
