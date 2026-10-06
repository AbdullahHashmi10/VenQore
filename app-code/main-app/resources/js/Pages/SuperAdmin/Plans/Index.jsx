import React, { useState, useCallback, useMemo } from 'react';
import { router, useForm, Head, usePage, Link } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { FEATURE_GROUPS, TOTAL_FEATURES, getFeatureDefault } from './featureGroups';
import { useT, Panel, PageHeader, Badge, Button, Input, Field as FormField, Select as FormSelect, EmptyState, KpiCard, BRAND } from '@/Platform/ui';
import { vq } from '@/theme/runtime';
import {
    Layers, Zap, Database, Ticket, ShoppingBag,
    UserCog, CheckCircle, XCircle, Star, Edit3,
    Copy, Trash2, ArrowUpRight, Shield, Activity,
    Info, Award, Server, LayoutGrid, Table2, Grid3x3,
    ChevronDown, ChevronRight, RefreshCw, Save, Archive,
    X, AlertTriangle, ArrowLeft
} from 'lucide-react';

// ── Existing limit keys (for the Plan Drawer) ────────────────────────────────

const LIMIT_KEYS = [
    { key: 'transactions_per_month', label: 'Transactions / Month', reset: 'monthly' },
    { key: 'sku_limit',              label: 'SKU / Product Limit',   reset: 'never'   },
    { key: 'locations',              label: 'Warehouse Locations',   reset: 'never'   },
    { key: 'staff_limit',            label: 'Staff Seats',           reset: 'never'   },
    { key: 'woocommerce',            label: 'WooCommerce Integration', reset: 'never'  },
    { key: 'api_access',             label: 'API Access Key',        reset: 'never'   },
    { key: 'growth_engine',          label: 'Growth Engine AI',      reset: 'never'   },
    { key: 'multi_branch',           label: 'Multi-Branch Support',  reset: 'never'   },
    { key: 'reports',                label: 'Reports Complexity',    reset: 'never'   },
];

const planTypeColor = (type) => ({
    trial: BRAND.indigo,
    subscription: BRAND.sky,
    ltd: BRAND.amber,
    enterprise: BRAND.emerald
}[type] || BRAND.slate);

// ── Feature Cell Component ───────────────────────────────────────────────────

function FeatureCell({ planId, planSlug, feature, value, onSave, saving }) {
    const t = useT();
    const isExplicit = value !== null && value !== undefined && value !== '';
    const defaultValue = getFeatureDefault(feature.key, planSlug);
    const hasDefault = defaultValue !== null && defaultValue !== undefined && defaultValue !== '';

    const [localNum, setLocalNum] = useState(value ?? '');
    const [editing, setEditing] = useState(false);

    React.useEffect(() => {
        setLocalNum(value ?? '');
    }, [value]);

    if (feature.type === 'number') {
        const displayPlaceholder = hasDefault ? String(defaultValue) : '∞';
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                <input
                    type="number"
                    value={localNum}
                    placeholder={displayPlaceholder}
                    onChange={e => { setLocalNum(e.target.value); setEditing(true); }}
                    onBlur={() => {
                        if (editing) {
                            onSave(planId, feature.key, localNum === '' ? null : localNum);
                            setEditing(false);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            onSave(planId, feature.key, localNum === '' ? null : localNum);
                            setEditing(false);
                            e.target.blur();
                        }
                    }}
                    title={isExplicit ? `Custom Override: ${value}` : `System Default: ${displayPlaceholder}`}
                    style={{
                        width: 72,
                        background: editing ? `${BRAND.indigo}14` : (isExplicit ? `${BRAND.indigo}1f` : t.inputBg),
                        border: `1px solid ${editing ? BRAND.indigo : (isExplicit ? `${BRAND.indigo}55` : t.inputBorder)}`,
                        color: isExplicit ? BRAND.indigo : t.muted,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: isExplicit ? 800 : 600,
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'all 0.15s',
                    }}
                />
                {saving && <RefreshCw size={10} style={{ color: BRAND.indigo, animation: 'spin 1s linear infinite' }} />}
            </div>
        );
    }

    if (feature.type === 'select') {
        const opts = feature.options || [];
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                <select
                    value={value ?? ''}
                    onChange={e => onSave(planId, feature.key, e.target.value || null)}
                    title={isExplicit ? `Custom Override: ${value}` : `System Default: ${defaultValue ?? 'default'}`}
                    style={{
                        background: isExplicit ? `${BRAND.indigo}1f` : t.inputBg,
                        border: `1px solid ${isExplicit ? `${BRAND.indigo}55` : t.inputBorder}`,
                        color: isExplicit ? BRAND.indigo : t.muted,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                >
                    <option value="" style={{ color: t.muted }}>
                        {defaultValue ? `default (${defaultValue})` : 'default'}
                    </option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {saving && <RefreshCw size={10} style={{ color: BRAND.indigo, animation: 'spin 1s linear infinite' }} />}
            </div>
        );
    }

    if (feature.type === 'system' || feature.readOnly) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                <span
                    title="System Infrastructure Gate (Protected)"
                    style={{
                        fontSize: 10,
                        color: t.muted,
                        background: t.inputBg,
                        border: `1px solid ${t.border}`,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontFamily: 'monospace'
                    }}
                >
                    SYS
                </span>
            </div>
        );
    }

    // Boolean toggle
    const isEnabled = isExplicit
        ? (value === '1' || value === 'true' || value === true)
        : (defaultValue === '1' || defaultValue === 'true' || defaultValue === true || defaultValue === 1);

    const isDisabled = isExplicit
        ? (value === '0' || value === 'false' || value === false)
        : (defaultValue === '0' || defaultValue === 'false' || defaultValue === false || defaultValue === 0);

    const next = isEnabled ? '0' : '1';

    let bg, color, border, label;
    if (isEnabled) {
        if (isExplicit) {
            bg = `${BRAND.emerald}24`; color = BRAND.emerald;
            border = `1px solid ${BRAND.emerald}66`; label = '✓';
        } else {
            bg = `${BRAND.emerald}10`; color = BRAND.emerald;
            border = `1px dashed ${BRAND.emerald}40`; label = '✓';
        }
    } else if (isDisabled) {
        if (isExplicit) {
            bg = `${BRAND.rose}18`; color = BRAND.rose;
            border = `1px solid ${BRAND.rose}55`; label = '✕';
        } else {
            bg = `${BRAND.rose}0a`; color = BRAND.rose;
            border = `1px dashed ${BRAND.rose}30`; label = '✕';
        }
    } else {
        bg = t.inputBg; color = t.muted;
        border = `1px solid ${t.border}`; label = '—';
    }

    const titleText = isExplicit
        ? `${isEnabled ? 'Enabled (Override)' : 'Disabled (Override)'} · Click to toggle`
        : `${isEnabled ? 'Enabled (Default)' : 'Disabled (Default)'} · Click to override`;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <button
                onClick={() => onSave(planId, feature.key, next)}
                disabled={saving}
                title={titleText}
                style={{
                    background: bg, color, border,
                    width: 36, height: 28,
                    borderRadius: 8,
                    fontSize: 13, fontWeight: 900,
                    cursor: saving ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                    opacity: saving ? 0.6 : 1,
                }}
            >
                {saving ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : label}
            </button>
        </div>
    );
}

// ── Feature Matrix Component ──────────────────────────────────────────────────

function FeatureMatrix({ plans }) {
    const t = useT();
    const { vensynq_enabled, canonical_keys } = usePage().props;
    const vensynqKeys = [
        'vensync_command',
        'marketplace_oauth',
        'commission_isolation',
        'dropshipping',
        'jit_procurement',
        'bulk_tracking_sync',
        'multichannel_expense_alloc'
    ];

    // Detect any canonical keys not mapped in FEATURE_GROUPS
    const existingKeys = new Set(FEATURE_GROUPS.flatMap(g => g.features.map(f => f.key)));
    const ungroupedKeys = (canonical_keys || []).filter(k => !existingKeys.has(k));

    const allGroups = [...FEATURE_GROUPS];
    if (ungroupedKeys.length > 0) {
        allGroups.push({
            id: 'ungrouped_new',
            label: 'Ungrouped / New Features',
            emoji: '📦',
            description: 'Canonical features detected from plan matrix pending categorization',
            features: ungroupedKeys.map(k => ({
                key: k,
                label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                type: (k.includes('limit') || k.includes('count') || k.includes('days') || k.includes('seats') || k.includes('registers') || k.includes('locations') || k.includes('credits') || k.includes('jobs')) ? 'number' : 'boolean',
                note: 'Auto-detected from canonical plan matrix'
            }))
        });
    }

    const filteredGroups = allGroups.map(group => {
        if (group.id === 'ecommerce' && !vensynq_enabled) {
            return {
                ...group,
                features: group.features.filter(f => !vensynqKeys.includes(f.key))
            };
        }
        return group;
    });
    const totalFilteredFeatures = filteredGroups.reduce((acc, g) => acc + g.features.length, 0);

    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [stagedChanges, setStagedChanges] = useState({});
    const [saving, setSaving] = useState(false);

    const [localMatrix, setLocalMatrix] = useState(() => {
        const m = {};
        plans.forEach(plan => {
            m[plan.id] = {};
            (plan.limits || []).forEach(l => {
                m[plan.id][l.key] = l.value;
            });
        });
        return m;
    });

    const toggleGroup = (groupId) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const handleCellChange = useCallback((planId, featureKey, newValue) => {
        setLocalMatrix(prev => ({
            ...prev,
            [planId]: { ...prev[planId], [featureKey]: newValue }
        }));

        setStagedChanges(prev => {
            const planChanges = { ...prev[planId], [featureKey]: newValue };
            const originalPlan = plans.find(p => p.id === planId);
            const originalLimit = originalPlan?.limits?.find(l => l.key === featureKey);
            const originalValue = originalLimit?.value ?? null;

            const normNew = newValue !== null ? String(newValue) : null;
            const normOrig = originalValue !== null ? String(originalValue) : null;

            if (normNew === normOrig) {
                delete planChanges[featureKey];
            }

            const next = { ...prev, [planId]: planChanges };
            if (Object.keys(next[planId]).length === 0) {
                delete next[planId];
            }
            return next;
        });
    }, [plans]);

    const stagedCount = Object.values(stagedChanges).reduce((acc, changes) => acc + Object.keys(changes).length, 0);

    const handleSaveStaged = () => {
        if (stagedCount === 0) return;
        setSaving(true);

        router.put(
            route('platform.plans.bulk-update'),
            { changes: stagedChanges },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setStagedChanges({});
                },
                onFinish: () => setSaving(false)
            }
        );
    };

    const handleDiscardChanges = () => {
        if (confirm(`Discard all ${stagedCount} unsaved feature matrix changes?`)) {
            const restored = {};
            plans.forEach(plan => {
                restored[plan.id] = {};
                (plan.limits || []).forEach(l => {
                    restored[plan.id][l.key] = l.value;
                });
            });
            setLocalMatrix(restored);
            setStagedChanges({});
        }
    };

    const planColors = [BRAND.indigo, BRAND.sky, BRAND.emerald, BRAND.amber, BRAND.rose, BRAND.purple];

    const handleBulkSet = useCallback((planId, value) => {
        const boolKeys = filteredGroups.flatMap(g =>
            g.features.filter(f => f.type === 'boolean' && f.type !== 'system' && !f.system && !f.readOnly).map(f => f.key)
        );

        setLocalMatrix(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                ...Object.fromEntries(boolKeys.map(k => [k, value]))
            }
        }));

        setStagedChanges(prev => {
            const planChanges = { ...prev[planId] };
            const originalPlan = plans.find(p => p.id === planId);

            boolKeys.forEach(key => {
                const originalLimit = originalPlan?.limits?.find(l => l.key === key);
                const originalValue = originalLimit?.value ?? null;

                const normNew = value !== null ? String(value) : null;
                const normOrig = originalValue !== null ? String(originalValue) : null;

                if (normNew === normOrig) {
                    delete planChanges[key];
                } else {
                    planChanges[key] = value;
                }
            });

            const next = { ...prev, [planId]: planChanges };
            if (Object.keys(next[planId]).length === 0) {
                delete next[planId];
            }
            return next;
        });
    }, [plans, filteredGroups]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {/* Universal Reports Notice Banner */}
            <div style={{
                margin: '0 0 16px 0',
                padding: '12px 18px',
                background: `${BRAND.emerald}12`,
                border: `1px solid ${BRAND.emerald}33`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: BRAND.emerald,
                fontSize: 12.5,
                fontWeight: 600
            }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <span>
                    <strong>Universal Reports:</strong> All 23 business, audit, and analytical reports are universal and included across all active plans.
                </span>
            </div>

            {/* Matrix header info */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px',
                background: t.panel2,
                border: `1px solid ${t.border}`,
                borderRadius: '16px 16px 0 0',
                borderBottom: 'none',
                flexWrap: 'wrap',
                gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Grid3x3 size={16} style={{ color: BRAND.indigo }} />
                    <span style={{ color: t.ink, fontSize: 13.5, fontWeight: 900 }}>
                        Feature Matrix
                    </span>
                    <Badge color={BRAND.indigo} tone="soft">
                        {totalFilteredFeatures} Features · {plans.length} Plans
                    </Badge>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: `${BRAND.emerald}25`, border: `1px solid ${BRAND.emerald}55` }} />
                        <span style={{ fontWeight: 600 }}>✓ Enabled</span>
                    </span>
                    <span style={{ fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: `${BRAND.rose}20`, border: `1px solid ${BRAND.rose}50` }} />
                        <span style={{ fontWeight: 600 }}>✕ Disabled</span>
                    </span>
                    <span style={{ fontSize: 11.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: t.inputBg, border: `1px solid ${t.border}` }} />
                        <span style={{ fontWeight: 600 }}>— Default</span>
                    </span>
                </div>
            </div>

            {/* Bulk Actions toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '10px 24px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderTop: 'none', borderBottom: 'none',
                overflowX: 'auto',
            }}>
                <span style={{ color: t.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    Bulk Actions:
                </span>
                {plans.map((plan, pi) => (
                    <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ color: planColors[pi % planColors.length], fontSize: 11, fontWeight: 800, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {plan.name}
                        </span>
                        <button
                            onClick={() => handleBulkSet(plan.id, '1')}
                            title={`Enable all boolean features for ${plan.name}`}
                            style={{
                                background: `${BRAND.emerald}18`, color: BRAND.emerald,
                                border: `1px solid ${BRAND.emerald}44`,
                                borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            ✓ All ON
                        </button>
                        <button
                            onClick={() => handleBulkSet(plan.id, '0')}
                            title={`Disable all boolean features for ${plan.name}`}
                            style={{
                                background: `${BRAND.rose}15`, color: BRAND.rose,
                                border: `1px solid ${BRAND.rose}33`,
                                borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            ✕ All OFF
                        </button>
                    </div>
                ))}
            </div>

            {/* Matrix table container */}
            <div style={{ overflowX: 'auto', background: t.panel, borderRadius: '0 0 16px 16px', border: `1px solid ${t.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: plans.length * 120 + 260 }}>
                    <colgroup>
                        <col style={{ width: 280, minWidth: 220 }} />
                        {plans.map(p => <col key={p.id} style={{ width: 120, minWidth: 100 }} />)}
                    </colgroup>
                    <thead>
                        <tr style={{ background: t.panel2, borderBottom: `2px solid ${t.border2}`, position: 'sticky', top: 0, zIndex: 20 }}>
                            <th style={{ padding: '14px 20px', textAlign: 'left', color: t.muted, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Feature / Capability
                            </th>
                            {plans.map((plan, idx) => (
                                <th key={plan.id} style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'bottom' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: planColors[idx % planColors.length],
                                            boxShadow: `0 0 8px ${planColors[idx % planColors.length]}`,
                                        }} />
                                        <span style={{ color: planColors[idx % planColors.length], fontWeight: 900, fontSize: 13 }}>
                                            {plan.name}
                                        </span>
                                        <span style={{ color: t.muted, fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700 }}>
                                            {plan.slug}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.map((group, gi) => {
                            const isCollapsed = collapsedGroups[group.id];
                            return (
                                <React.Fragment key={group.id}>
                                    {/* Group header row */}
                                    <tr
                                        style={{ background: t.hover, borderTop: gi > 0 ? `2px solid ${t.border}` : 'none', cursor: 'pointer' }}
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <td colSpan={plans.length + 1} style={{ padding: '10px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 14 }}>{group.emoji}</span>
                                                <div>
                                                    <span style={{ color: BRAND.indigo, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {group.label}
                                                    </span>
                                                    {group.description && !isCollapsed && (
                                                        <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{group.description}</div>
                                                    )}
                                                </div>
                                                <span style={{ color: t.muted, fontSize: 10.5, background: t.inputBg, border: `1px solid ${t.border}`, padding: '1px 8px', borderRadius: 6, flexShrink: 0, fontWeight: 700 }}>
                                                    {group.features.length} features
                                                </span>
                                                <span style={{ marginLeft: 'auto', color: t.muted }}>
                                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Feature rows */}
                                    {!isCollapsed && group.features.map((feature) => (
                                        <tr
                                            key={feature.key}
                                            style={{ borderBottom: `1px solid ${t.rowBorder}`, transition: 'background 0.1s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = t.hover; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '10px 20px 10px 32px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ color: t.ink, fontSize: 12.5, fontWeight: 700 }}>
                                                            {feature.label}
                                                        </span>
                                                        {feature.type === 'number' && (
                                                            <span style={{ fontSize: 9, color: BRAND.sky, background: `${BRAND.sky}18`, border: `1px solid ${BRAND.sky}33`, padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                                                                NUM
                                                            </span>
                                                        )}
                                                        {feature.type === 'select' && (
                                                            <span style={{ fontSize: 9, color: BRAND.amber, background: `${BRAND.amber}18`, border: `1px solid ${BRAND.amber}33`, padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                                                                TIER
                                                            </span>
                                                        )}
                                                    </div>
                                                    {feature.note && (
                                                        <span style={{ fontSize: 10.5, color: t.muted, fontStyle: 'italic' }}>{feature.note}</span>
                                                    )}
                                                </div>
                                            </td>
                                            {plans.map(plan => (
                                                <td key={plan.id} style={{ padding: '7px 12px', textAlign: 'center' }}>
                                                    <FeatureCell
                                                        planId={plan.id}
                                                        planSlug={plan.slug}
                                                        feature={feature}
                                                        value={localMatrix[plan.id]?.[feature.key]}
                                                        onSave={handleCellChange}
                                                        saving={saving}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer note */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: t.muted, fontSize: 11.5 }}>
                <Shield size={13} style={{ color: BRAND.indigo }} />
                <span>Changes are staged locally. Click "Save Changes" to publish all tier updates instantly to active tenants.</span>
            </div>

            {/* Floating Save Panel */}
            {stagedCount > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: t.panelSolid,
                    border: `1px solid ${BRAND.indigo}66`,
                    borderRadius: 16,
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 28,
                    boxShadow: t.shadow,
                    zIndex: 100,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: `${BRAND.indigo}20`,
                            color: BRAND.indigo,
                            fontSize: 12,
                            fontWeight: 900,
                            border: `1px solid ${BRAND.indigo}55`
                        }}>
                            {stagedCount}
                        </span>
                        <span style={{ color: t.ink, fontSize: 13, fontWeight: 700 }}>
                            Unsaved Feature Matrix updates pending
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleDiscardChanges}
                            disabled={saving}
                        >
                            Discard
                        </Button>
                        <Button
                            size="sm"
                            variant="primary"
                            icon={Save}
                            onClick={handleSaveStaged}
                            disabled={saving}
                        >
                            {saving ? 'Publishing…' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Plan Drawer (Modal Slide-Out) ─────────────────────────────────────────────

function PlanDrawer({ open, onClose, plan, platforms }) {
    const t = useT();
    const isEdit = !!plan;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        platform_id:    plan?.platform_id   ?? (platforms[0]?.id ?? ''),
        name:           plan?.name          ?? '',
        display_name:   plan?.display_name  ?? '',
        slug:           plan?.slug          ?? '',
        type:           plan?.type          ?? 'subscription',
        price_monthly:  plan?.price_monthly  ?? '',
        price_annual:   plan?.price_annual   ?? '',
        price_lifetime: plan?.price_lifetime ?? '',
        price_monthly_pkr:  plan?.price_monthly_pkr  ?? '',
        price_annual_pkr:   plan?.price_annual_pkr   ?? '',
        price_lifetime_pkr: plan?.price_lifetime_pkr ?? '',
        checkout_url_usd:   plan?.checkout_url_usd   ?? '',
        checkout_url_pkr:   plan?.checkout_url_pkr   ?? '',
        is_featured:    plan?.is_featured    ?? false,
        is_active:      plan?.is_active      ?? true,
        is_visible:     plan?.is_visible     ?? true,
        sort_order:     plan?.sort_order     ?? 0,
        internal_notes: plan?.internal_notes ?? '',
        limits: LIMIT_KEYS.map(({ key, reset }) => {
            const existing = plan?.limits?.find(l => l.key === key);
            return { key, value: existing?.value ?? '', reset_period: existing?.reset_period ?? reset };
        }),
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('platform.plans.update', { plan: plan.id }), { onSuccess: () => { reset(); onClose(); } });
        } else {
            post(route('platform.plans.store'), { onSuccess: () => { reset(); onClose(); } });
        }
    };

    if (!open) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'var(--vq-scrim)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div style={{
                position: 'absolute',
                top: 0, right: 0, bottom: 0,
                width: 620,
                maxWidth: '100%',
                background: t.panelSolid,
                borderLeft: `1px solid ${t.border2}`,
                boxShadow: t.shadow,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                zIndex: 2,
            }}>
                {/* Drawer Header */}
                <div style={{ padding: '22px 28px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.panelSolid, position: 'sticky', top: 0, zIndex: 3 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: t.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layers size={18} style={{ color: BRAND.indigo }} /> {isEdit ? `Edit Tier: ${plan.name}` : 'Create Subscription Tier'}
                        </h2>
                        <span style={{ fontSize: 12, color: t.muted, marginTop: 2, display: 'block' }}>Platform subscription pipeline parameters</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: t.inputBg,
                            border: `1px solid ${t.border}`,
                            color: t.muted,
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Basic Config */}
                    <Panel pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.indigo, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Info size={13} /> Basic Configuration
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormField label="Platform System" error={errors.platform_id}>
                                <select
                                    style={{
                                        width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10,
                                        background: t.inputBg, color: t.ink, border: `1px solid ${t.inputBorder}`, outline: 'none'
                                    }}
                                    value={data.platform_id}
                                    onChange={e => setData('platform_id', e.target.value)}
                                    disabled={isEdit}
                                >
                                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Tier Type" error={errors.type}>
                                <select
                                    style={{
                                        width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 10,
                                        background: t.inputBg, color: t.ink, border: `1px solid ${t.inputBorder}`, outline: 'none'
                                    }}
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                >
                                    {['trial','subscription','ltd','enterprise'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <FormField label="Plan Title" error={errors.name}>
                                <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Starter" />
                            </FormField>
                            <FormField label="Display Name" error={errors.display_name}>
                                <Input value={data.display_name} onChange={e => setData('display_name', e.target.value)} placeholder="e.g. Starter Engine" />
                            </FormField>
                            <FormField label="Identifier Slug" error={errors.slug}>
                                <Input value={data.slug} onChange={e => setData('slug', e.target.value)} placeholder="e.g. starter" disabled={isEdit} />
                            </FormField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <FormField label="Featured Tier">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={data.is_featured ? 'primary' : 'secondary'}
                                    onClick={() => setData('is_featured', !data.is_featured)}
                                    style={{ width: '100%' }}
                                >
                                    {data.is_featured ? '★ Featured' : 'Normal'}
                                </Button>
                            </FormField>
                            <FormField label="Active State">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={data.is_active ? 'success' : 'secondary'}
                                    onClick={() => setData('is_active', !data.is_active)}
                                    style={{ width: '100%' }}
                                >
                                    {data.is_active ? '✓ Active' : 'Inactive'}
                                </Button>
                            </FormField>
                            <FormField label="Public Visibility">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={data.is_visible ? 'primary' : 'secondary'}
                                    onClick={() => setData('is_visible', !data.is_visible)}
                                    style={{ width: '100%' }}
                                >
                                    {data.is_visible ? 'Visible' : 'Hidden'}
                                </Button>
                            </FormField>
                        </div>
                    </Panel>

                    {/* Standard Pricing */}
                    <Panel pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.indigo, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={13} /> Standard Monies (USD)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <FormField label="Monthly Rate ($)" error={errors.price_monthly}>
                                <Input type="number" step="0.01" value={data.price_monthly} onChange={e => setData('price_monthly', e.target.value)} placeholder="29.00" />
                            </FormField>
                            <FormField label="Annual Rate ($)" error={errors.price_annual}>
                                <Input type="number" step="0.01" value={data.price_annual} onChange={e => setData('price_annual', e.target.value)} placeholder="290.00" />
                            </FormField>
                            <FormField label="Lifetime LTD ($)" error={errors.price_lifetime}>
                                <Input type="number" step="0.01" value={data.price_lifetime} onChange={e => setData('price_lifetime', e.target.value)} placeholder="179.00" />
                            </FormField>
                        </div>

                        {/* Localized PKR Overrides */}
                        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 800, color: BRAND.emerald, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                🇵🇰 Localized Rupee Pricing (PKR Overrides)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <FormField label="Monthly (PKR)" error={errors.price_monthly_pkr}>
                                    <Input type="number" value={data.price_monthly_pkr} onChange={e => setData('price_monthly_pkr', e.target.value)} placeholder="1100" />
                                </FormField>
                                <FormField label="Annual (PKR)" error={errors.price_annual_pkr}>
                                    <Input type="number" value={data.price_annual_pkr} onChange={e => setData('price_annual_pkr', e.target.value)} placeholder="11000" />
                                </FormField>
                                <FormField label="Lifetime (PKR)" error={errors.price_lifetime_pkr}>
                                    <Input type="number" value={data.price_lifetime_pkr} onChange={e => setData('price_lifetime_pkr', e.target.value)} placeholder="22120" />
                                </FormField>
                            </div>
                        </div>
                    </Panel>

                    {/* Gateway Checkout URLs */}
                    <Panel pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.indigo, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Ticket size={13} /> Payment Gateway Routing
                        </div>
                        <FormField label="Standard Checkout URL (USD)" error={errors.checkout_url_usd}>
                            <Input type="url" value={data.checkout_url_usd} onChange={e => setData('checkout_url_usd', e.target.value)} placeholder="https://checkout.lemonsqueezy.com/buy/..." />
                        </FormField>
                        <FormField label="Localized Checkout URL (PKR)" error={errors.checkout_url_pkr}>
                            <Input type="url" value={data.checkout_url_pkr} onChange={e => setData('checkout_url_pkr', e.target.value)} placeholder="https://checkout.lemonsqueezy.com/buy/..." />
                        </FormField>
                    </Panel>

                    {/* System Limits & Allowances */}
                    <Panel pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.indigo, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Server size={13} /> System Limits & Allowances
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${t.border}`, background: t.panel2 }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', color: t.muted, fontWeight: 800, textTransform: 'uppercase' }}>Feature / Key</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', color: t.muted, fontWeight: 800, textTransform: 'uppercase' }}>Allowance (blank = ∞)</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', color: t.muted, fontWeight: 800, textTransform: 'uppercase' }}>Reset Period</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.limits.map((lim, i) => (
                                        <tr key={lim.key} style={{ borderBottom: `1px solid ${t.rowBorder}` }}>
                                            <td style={{ padding: '8px 12px', color: t.ink, fontWeight: 700 }}>
                                                {LIMIT_KEYS[i]?.label || lim.key}
                                            </td>
                                            <td style={{ padding: '6px 12px' }}>
                                                <Input
                                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                                    value={lim.value ?? ''}
                                                    placeholder="Unlimited"
                                                    onChange={e => {
                                                        const updated = [...data.limits];
                                                        updated[i] = { ...updated[i], value: e.target.value || null };
                                                        setData('limits', updated);
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 12px' }}>
                                                <select
                                                    style={{
                                                        width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 9,
                                                        background: t.inputBg, color: t.ink, border: `1px solid ${t.inputBorder}`, outline: 'none'
                                                    }}
                                                    value={lim.reset_period}
                                                    onChange={e => {
                                                        const updated = [...data.limits];
                                                        updated[i] = { ...updated[i], reset_period: e.target.value };
                                                        setData('limits', updated);
                                                    }}
                                                >
                                                    {['never','monthly','annually'].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    {/* Internal Notes */}
                    <Panel pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.indigo, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Award size={13} /> Internal Notes
                        </div>
                        <textarea
                            style={{
                                width: '100%', height: 70, resize: 'vertical', fontFamily: 'inherit',
                                borderRadius: 10, background: t.inputBg, color: t.ink, border: `1px solid ${t.inputBorder}`,
                                padding: '10px 12px', fontSize: 12.5, outline: 'none'
                            }}
                            value={data.internal_notes}
                            onChange={e => setData('internal_notes', e.target.value)}
                            placeholder="Platform team confidential notes…"
                        />
                    </Panel>

                    {/* Footer buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Plan'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PlansIndex({ plans = [], platforms = [] }) {
    const t = useT();
    const [activeTab, setActiveTab]   = useState(platforms[0]?.id);
    const [viewMode, setViewMode]     = useState('list');   // 'list' | 'matrix'
    const [drawerPlan, setDrawerPlan] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filteredPlans = useMemo(() => {
        return plans.filter(p => p.platform_id === activeTab);
    }, [plans, activeTab]);

    const openCreate  = () => { setDrawerPlan(null); setDrawerOpen(true); };
    const openEdit    = (plan) => { setDrawerPlan(plan); setDrawerOpen(true); };
    const closeDrawer = () => setDrawerOpen(false);

    const duplicate = (plan) => {
        if (confirm(`Duplicate subscription tier "${plan.name}"?`)) {
            router.post(route('platform.plans.duplicate', { plan: plan.id }));
        }
    };

    const destroy = (plan) => {
        if (confirm(`Delete subscription tier "${plan.name}"? Irreversible action.`)) {
            router.delete(route('platform.plans.destroy', { plan: plan.id }));
        }
    };

    const archive = (plan) => {
        if (confirm(`Archive subscription tier "${plan.name}"? This will disable it and hide it from signup lists.`)) {
            router.post(route('platform.plans.archive', { plan: plan.id }));
        }
    };

    const unarchive = (plan) => {
        if (confirm(`Unarchive subscription tier "${plan.name}"?`)) {
            router.post(route('platform.plans.unarchive', { plan: plan.id }));
        }
    };

    const toggleActive = (plan) => {
        router.put(route('platform.plans.update', { plan: plan.id }), { is_active: !plan.is_active });
    };

    const totalActiveTenants = useMemo(() => {
        return filteredPlans.reduce((sum, p) => sum + (p.active_tenant_count || 0), 0);
    }, [filteredPlans]);

    return (
        <PlatformLayout title="SaaS Subscriptions & Tiers">
            <Head title="Plans & Limits | VenQore Platform HQ" />

            <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Page Header ────────────────────────────────────────── */}
                <PageHeader
                    title="Subscription Tiers & Plan Matrix"
                    subtitle="Configure plan allowances, limits, local pricing overrides, and capability matrices across all platform systems."
                    icon={Layers}
                    accent={BRAND.indigo}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Link href={route('platform.dashboard')}>
                                <Button variant="secondary" icon={ArrowLeft} size="sm">
                                    Dashboard
                                </Button>
                            </Link>

                            {/* View Mode Toggle */}
                            <div style={{
                                display: 'inline-flex',
                                background: t.inputBg,
                                border: `1px solid ${t.border}`,
                                borderRadius: 12,
                                padding: 3,
                                gap: 2,
                            }}>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: viewMode === 'list' ? `${BRAND.indigo}1f` : 'transparent',
                                        color: viewMode === 'list' ? BRAND.indigo : t.muted,
                                        boxShadow: viewMode === 'list' ? `0 0 0 1px ${BRAND.indigo}44` : 'none',
                                    }}
                                >
                                    <Table2 size={13} /> Plans List
                                </button>
                                <button
                                    onClick={() => setViewMode('matrix')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 14px',
                                        fontSize: 12.5,
                                        fontWeight: 800,
                                        borderRadius: 9,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        background: viewMode === 'matrix' ? `${BRAND.indigo}1f` : 'transparent',
                                        color: viewMode === 'matrix' ? BRAND.indigo : t.muted,
                                        boxShadow: viewMode === 'matrix' ? `0 0 0 1px ${BRAND.indigo}44` : 'none',
                                    }}
                                >
                                    <Grid3x3 size={13} /> Feature Matrix
                                </button>
                            </div>

                            {viewMode === 'list' && (
                                <Button variant="primary" size="sm" onClick={openCreate}>
                                    + Create New Plan
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* ── KPI Metrics Bar ────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <KpiCard
                        label="Registered Tiers"
                        value={filteredPlans.length}
                        sub="In active platform system"
                        icon={Layers}
                        accent={BRAND.indigo}
                    />
                    <KpiCard
                        label="Active Merchant Stores"
                        value={totalActiveTenants}
                        sub="Subscribers on selected tiers"
                        icon={ShoppingBag}
                        accent={BRAND.emerald}
                    />
                    <KpiCard
                        label="Feature Matrix Gates"
                        value={TOTAL_FEATURES || 184}
                        sub="Fine-grained system toggles"
                        icon={Grid3x3}
                        accent={BRAND.purple}
                    />
                </div>

                {/* ── Platform Tabs Navigation ───────────────────────────── */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${t.border}`,
                    gap: 8,
                    paddingBottom: 2,
                }}>
                    {platforms.map(p => {
                        const isTabActive = activeTab === p.id;
                        const planCount = plans.filter(pl => pl.platform_id === p.id).length;

                        return (
                            <button
                                key={p.id}
                                onClick={() => setActiveTab(p.id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '10px 18px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    border: 'none',
                                    borderBottom: `2px solid ${isTabActive ? BRAND.indigo : 'transparent'}`,
                                    background: 'transparent',
                                    color: isTabActive ? t.ink : t.muted,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    marginBottom: -2,
                                }}
                            >
                                <Database size={14} style={{ color: isTabActive ? BRAND.indigo : t.muted }} />
                                <span>{p.name}</span>
                                <span style={{
                                    fontSize: 11,
                                    padding: '2px 7px',
                                    borderRadius: 999,
                                    background: isTabActive ? `${BRAND.indigo}18` : t.inputBg,
                                    color: isTabActive ? BRAND.indigo : t.muted,
                                    fontWeight: 700,
                                }}>
                                    {planCount}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── View 1: Plans List ──────────────────────────────────── */}
                {viewMode === 'list' && (
                    <Panel pad={0} style={{ overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                                <thead>
                                    <tr style={{ background: t.panel2, borderBottom: `1px solid ${t.border}` }}>
                                        {['Subscription Tier', 'Platform Type', 'Standard Pricing', 'Active Stores', 'Key Limits Matrix', 'Visibility', 'Operator Control'].map(h => (
                                            <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlans.length === 0 ? (
                                        <tr>
                                            <td colSpan={7}>
                                                <EmptyState
                                                    icon={LayoutGrid}
                                                    title="No plans registered"
                                                    message="No subscription tiers have been created for this platform system yet."
                                                    action={
                                                        <Button size="sm" variant="primary" onClick={openCreate}>
                                                            + Create First Plan
                                                        </Button>
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPlans.map(plan => (
                                            <tr
                                                key={plan.id}
                                                style={{ borderBottom: `1px solid ${t.rowBorder}`, transition: 'background 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = t.hover; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: plan.is_active ? BRAND.emerald : t.muted,
                                                            boxShadow: plan.is_active ? `0 0 8px ${BRAND.emerald}` : 'none',
                                                            flexShrink: 0
                                                        }} />
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: t.ink, fontSize: 14 }}>
                                                                {plan.name}
                                                            </div>
                                                            <div style={{ fontSize: 10.5, color: t.muted, marginTop: 2, fontFamily: 'monospace' }}>
                                                                {plan.slug}
                                                            </div>
                                                        </div>
                                                        {plan.is_featured && (
                                                            <Badge color={BRAND.amber} tone="soft">
                                                                <Star size={9} /> Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>

                                                <td style={{ padding: '16px 20px' }}>
                                                    <Badge color={planTypeColor(plan.type)} tone="soft">
                                                        {plan.type}
                                                    </Badge>
                                                </td>

                                                <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: t.sub }}>
                                                    <div>
                                                        {plan.price_monthly  ? `$${parseFloat(plan.price_monthly).toFixed(0)}/mo` : ''}
                                                        {plan.price_annual   ? ` · $${parseFloat(plan.price_annual).toFixed(0)}/yr` : ''}
                                                        {plan.price_lifetime ? `$${parseFloat(plan.price_lifetime).toFixed(0)} once` : ''}
                                                        {!plan.price_monthly && !plan.price_annual && !plan.price_lifetime ? <span style={{ color: t.muted }}>—</span> : ''}
                                                    </div>
                                                    {(plan.price_monthly_pkr || plan.price_annual_pkr || plan.price_lifetime_pkr) && (
                                                        <div style={{ fontSize: 11, color: BRAND.emerald, marginTop: 4, fontWeight: 700 }}>
                                                            {plan.price_monthly_pkr  ? `Rs ${parseFloat(plan.price_monthly_pkr).toFixed(0)}/mo` : ''}
                                                            {plan.price_annual_pkr   ? ` · Rs ${parseFloat(plan.price_annual_pkr).toFixed(0)}/yr` : ''}
                                                            {plan.price_lifetime_pkr ? ` · Rs ${parseFloat(plan.price_lifetime_pkr).toFixed(0)} once` : ''}
                                                        </div>
                                                    )}
                                                </td>

                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{ fontWeight: 900, color: plan.active_tenant_count > 0 ? BRAND.emerald : t.muted, fontSize: 15, fontFamily: 'monospace' }}>
                                                        {plan.active_tenant_count ?? 0}
                                                    </span>
                                                </td>

                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', maxWidth: 360 }}>
                                                        {plan.limits?.slice(0, 3).map(l => (
                                                            <span key={l.key} style={{ fontSize: 10, color: t.sub, background: t.inputBg, border: `1px solid ${t.border}`, padding: '2px 7px', borderRadius: 6, fontFamily: 'monospace' }}>
                                                                {LIMIT_KEYS.find(k => k.key === l.key)?.label.replace(' Integration', '').replace(' AI', '').replace(' Support', '') || l.key}: {l.value ?? '∞'}
                                                            </span>
                                                        ))}
                                                        {plan.limits?.length > 3 && (
                                                            <span style={{ fontSize: 10, color: t.muted, padding: '2px 6px', fontWeight: 700 }}>
                                                                +{plan.limits.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td style={{ padding: '16px 20px' }}>
                                                    {plan.archived_at ? (
                                                        <Badge color={BRAND.rose} tone="soft">Archived</Badge>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleActive(plan)}
                                                            style={{
                                                                background: plan.is_active ? `${BRAND.emerald}18` : t.inputBg,
                                                                color: plan.is_active ? BRAND.emerald : t.muted,
                                                                border: `1px solid ${plan.is_active ? `${BRAND.emerald}44` : t.border}`,
                                                                padding: '4px 12px', borderRadius: 8,
                                                                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            {plan.is_active ? 'Visible' : 'Hidden'}
                                                        </button>
                                                    )}
                                                </td>

                                                <td style={{ padding: '16px 20px' }}>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <Button size="sm" variant="secondary" icon={Edit3} onClick={() => openEdit(plan)}>
                                                            Edit
                                                        </Button>
                                                        <Button size="sm" variant="secondary" icon={Copy} onClick={() => duplicate(plan)}>
                                                            Clone
                                                        </Button>
                                                        {plan.archived_at ? (
                                                            <Button size="sm" variant="secondary" onClick={() => unarchive(plan)} style={{ color: BRAND.emerald }}>
                                                                Restore
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="secondary" onClick={() => archive(plan)} style={{ color: BRAND.amber }}>
                                                                Archive
                                                            </Button>
                                                        )}
                                                        <button
                                                            onClick={() => destroy(plan)}
                                                            disabled={plan.active_tenant_count > 0}
                                                            title={plan.active_tenant_count > 0 ? `${plan.active_tenant_count} tenants on this plan` : 'Delete'}
                                                            style={{
                                                                background: `${BRAND.rose}15`,
                                                                border: `1px solid ${BRAND.rose}33`,
                                                                color: BRAND.rose,
                                                                borderRadius: 8,
                                                                padding: 7,
                                                                cursor: plan.active_tenant_count > 0 ? 'not-allowed' : 'pointer',
                                                                opacity: plan.active_tenant_count > 0 ? 0.3 : 1,
                                                                display: 'grid',
                                                                placeItems: 'center',
                                                            }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                )}

                {/* ── View 2: Feature Matrix ──────────────────────────────── */}
                {viewMode === 'matrix' && (
                    filteredPlans.length === 0 ? (
                        <Panel pad={48}>
                            <EmptyState
                                icon={Grid3x3}
                                title="No plans exist for this platform"
                                message="Create a subscription tier first, then return here to configure its feature matrix."
                                action={
                                    <Button size="sm" variant="primary" onClick={() => setViewMode('list')}>
                                        Go to Plans List
                                    </Button>
                                }
                            />
                        </Panel>
                    ) : (
                        <FeatureMatrix plans={filteredPlans} />
                    )
                )}
            </div>

            {/* Plan Drawer Slide-Out */}
            {drawerOpen && (
                <PlanDrawer
                    open={drawerOpen}
                    onClose={closeDrawer}
                    plan={drawerPlan}
                    platforms={platforms}
                />
            )}
        </PlatformLayout>
    );
}
