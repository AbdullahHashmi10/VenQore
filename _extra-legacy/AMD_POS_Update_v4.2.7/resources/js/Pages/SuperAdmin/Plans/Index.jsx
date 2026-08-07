import React, { useState, useCallback } from 'react';
import { router, useForm, Head, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell
import { FEATURE_GROUPS, TOTAL_FEATURES, getFeatureDefault } from './featureGroups';
import {
    Layers, Zap, Database, Ticket, ShoppingBag,
    UserCog, CheckCircle, XCircle, Star, Edit3,
    Copy, Trash2, ArrowUpRight, Shield, Activity,
    Info, Award, Server, LayoutGrid, Table2, Grid3x3,
    ChevronDown, ChevronRight, RefreshCw, Save, Archive
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

// FEATURE_GROUPS and TOTAL_FEATURES are now imported from ./featureGroups.js

// ── Value display helpers ────────────────────────────────────────────────────

const displayValue = (v) => {
    if (v === null || v === undefined || v === '') {
        return <span className="badge-glass" style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)' }}>Unlimited</span>;
    }
    if (v === '0' || v === false) {
        return <span className="badge-glass" style={{ color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)' }}>Disabled</span>;
    }
    if (v === '1' || v === true) {
        return <span className="badge-glass" style={{ color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>Enabled</span>;
    }
    return <span className="badge-glass" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)' }}>{v}</span>;
};

const planTypeColor = (type) => ({
    trial: '#6366f1',
    subscription: '#38bdf8',
    ltd: '#f59e0b',
    enterprise: '#10b981'
}[type] || '#94a3b8');

// ── Feature Cell Component ───────────────────────────────────────────────────

function FeatureCell({ planId, planSlug, feature, value, onSave, saving }) {
    const isExplicit = value !== null && value !== undefined && value !== '';
    const defaultValue = getFeatureDefault(feature.key, planSlug);
    const hasDefault = defaultValue !== null && defaultValue !== undefined && defaultValue !== '';

    const [localNum, setLocalNum] = useState(value ?? '');
    const [editing, setEditing] = useState(false);

    // Sync input value if props update
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
                        width: 70,
                        background: editing ? 'rgba(99,102,241,0.08)' : (isExplicit ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)'),
                        border: `1px solid ${editing ? 'rgba(99,102,241,0.4)' : (isExplicit ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)')}`,
                        color: isExplicit ? '#c7d2fe' : '#475569',
                        padding: '5px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: isExplicit ? 800 : 500,
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'all 0.15s',
                    }}
                />
                {saving && <RefreshCw size={10} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />}
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
                        background: isExplicit ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.25)',
                        border: `1px solid ${isExplicit ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        color: isExplicit ? '#c7d2fe' : '#475569',
                        padding: '5px 8px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                >
                    <option value="" style={{ color: '#475569' }}>
                        {defaultValue ? `default (${defaultValue})` : 'default'}
                    </option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {saving && <RefreshCw size={10} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />}
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
            bg = 'rgba(16,185,129,0.16)'; color = '#34d399';
            border = '1px solid rgba(16,185,129,0.45)'; label = '✓';
        } else {
            bg = 'rgba(16,185,129,0.05)'; color = 'rgba(52,211,153,0.5)';
            border = '1px dashed rgba(16,185,129,0.25)'; label = '✓';
        }
    } else if (isDisabled) {
        if (isExplicit) {
            bg = 'rgba(239,68,68,0.12)'; color = '#f87171';
            border = '1px solid rgba(239,68,68,0.35)'; label = '✕';
        } else {
            bg = 'rgba(239,68,68,0.03)'; color = 'rgba(248,113,113,0.4)';
            border = '1px dashed rgba(239,68,68,0.15)'; label = '✕';
        }
    } else {
        bg = 'rgba(255,255,255,0.03)'; color = '#475569';
        border = '1px solid rgba(255,255,255,0.05)'; label = '—';
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
                    fontSize: 14, fontWeight: 900,
                    cursor: saving ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                    opacity: saving ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {saving ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : label}
            </button>
        </div>
    );
}

// ── Feature Matrix Component ──────────────────────────────────────────────────

function FeatureMatrix({ plans }) {
    const { vensynq_enabled } = usePage().props;
    const vensynqKeys = [
        'vensync_command',
        'marketplace_oauth',
        'commission_isolation',
        'dropshipping',
        'jit_procurement',
        'bulk_tracking_sync',
        'multichannel_expense_alloc'
    ];
    const filteredGroups = FEATURE_GROUPS.map(group => {
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
        // Optimistic local update
        setLocalMatrix(prev => ({
            ...prev,
            [planId]: { ...prev[planId], [featureKey]: newValue }
        }));

        // Track pending changes locally
        setStagedChanges(prev => {
            const planChanges = { ...prev[planId], [featureKey]: newValue };

            // Fetch the original value from plans prop
            const originalPlan = plans.find(p => p.id === planId);
            const originalLimit = originalPlan?.limits?.find(l => l.key === featureKey);
            const originalValue = originalLimit?.value ?? null;

            // Normalize values for exact comparison
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

    const planColors = ['#818cf8', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a78bfa'];

    const handleBulkSet = useCallback((planId, value) => {
        const boolKeys = filteredGroups.flatMap(g =>
            g.features.filter(f => f.type === 'boolean').map(f => f.key)
        );

        // Optimistic local update
        setLocalMatrix(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                ...Object.fromEntries(boolKeys.map(k => [k, value]))
            }
        }));

        // Stage all these changes!
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
    }, [plans]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>

            {/* Matrix header info */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.12)',
                borderRadius: '16px 16px 0 0',
                borderBottom: 'none',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Grid3x3 size={16} color="#818cf8" />
                    <span style={{ color: '#c7d2fe', fontSize: 13, fontWeight: 800 }}>
                        Feature Matrix
                    </span>
                    <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.2)' }}>
                        {totalFilteredFeatures} FEATURES · {plans.length} PLANS
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }} />✓ Enabled
                    </span>
                    <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }} />✕ Disabled
                    </span>
                    <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />— Default
                    </span>
                </div>
            </div>

            {/* Bulk Actions toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 24px',
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(99,102,241,0.1)',
                borderTop: 'none', borderBottom: 'none',
                overflowX: 'auto',
            }}>
                <span style={{ color: '#475569', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
                    Bulk Actions:
                </span>
                {plans.map((plan, pi) => (
                    <div key={plan.id} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{ color: planColors[pi % planColors.length], fontSize: 10, fontWeight: 800, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {plan.name}
                        </span>
                        <button
                            onClick={() => handleBulkSet(plan.id, '1')}
                            title={`Enable all boolean features for ${plan.name}`}
                            style={{
                                background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.25)',
                                borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                        >
                            ✓ All ON
                        </button>
                        <button
                            onClick={() => handleBulkSet(plan.id, '0')}
                            title={`Disable all boolean features for ${plan.name}`}
                            style={{
                                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        >
                            ✕ All OFF
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(10,14,26,0.8)', borderRadius: '0 0 16px 16px', border: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(99,102,241,0.12)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: plans.length * 120 + 260 }}>
                    <colgroup>
                        <col style={{ width: 260, minWidth: 200 }} />
                        {plans.map(p => <col key={p.id} style={{ width: 120, minWidth: 100 }} />)}
                    </colgroup>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '2px solid rgba(99,102,241,0.15)', position: 'sticky', top: 0, zIndex: 20 }}>
                            <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                                        <span style={{ color: planColors[idx % planColors.length], fontWeight: 900, fontSize: 13, letterSpacing: '-0.01em' }}>
                                            {plan.name}
                                        </span>
                                        <span style={{ color: '#475569', fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>
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
                                        style={{ background: 'rgba(99,102,241,0.06)', borderTop: gi > 0 ? '2px solid rgba(99,102,241,0.08)' : 'none', cursor: 'pointer' }}
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        <td colSpan={plans.length + 1} style={{ padding: '10px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 14 }}>{group.emoji}</span>
                                                <div>
                                                    <span style={{ color: '#a5b4fc', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                        {group.label}
                                                    </span>
                                                    {group.description && !isCollapsed && (
                                                        <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>{group.description}</div>
                                                    )}
                                                </div>
                                                <span style={{ color: '#475569', fontSize: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1px 7px', borderRadius: 5, flexShrink: 0 }}>
                                                    {group.features.length} features
                                                </span>
                                                <span style={{ marginLeft: 'auto', color: '#475569' }}>
                                                    {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Feature rows */}
                                    {!isCollapsed && group.features.map((feature, fi) => (
                                        <tr
                                            key={feature.key}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.025)', transition: 'background 0.1s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                        >
                                            <td style={{ padding: '9px 20px 9px 32px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                                                        {feature.label}
                                                    </span>
                                                    {feature.type === 'number' && (
                                                        <span style={{ fontSize: 9, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                            NUM
                                                        </span>
                                                    )}
                                                    {feature.type === 'select' && (
                                                        <span style={{ fontSize: 9, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                            TIER
                                                        </span>
                                                    )}
                                                </div>
                                                {feature.note && (
                                                    <span style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>{feature.note}</span>
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
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 11 }}>
                <Shield size={11} />
                Changes are staged locally. Click "Save Changes" at the bottom to publish all updates instantly to active tenants.
            </div>

            {/* Sticky Floating Save Panel */}
            {stagedCount > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    borderRadius: 16,
                    padding: '14px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 32,
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2)',
                    zIndex: 50,
                    animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <style>{`
                        @keyframes fadeInUp {
                            from { opacity: 0; transform: translate(-50%, 20px); }
                            to   { opacity: 1; transform: translate(-50%, 0); }
                        }
                    `}</style>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            fontSize: 12,
                            fontWeight: 900,
                            border: '1px solid rgba(99, 102, 241, 0.4)'
                        }}>
                            {stagedCount}
                        </span>
                        <span style={{ color: '#c7d2fe', fontSize: 13, fontWeight: 700 }}>
                            Unsaved Feature Matrix changes pending
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={handleDiscardChanges}
                            disabled={saving}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                padding: '8px 16px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#f87171'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSaveStaged}
                            disabled={saving}
                            style={{
                                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                                border: 'none',
                                color: '#ffffff',
                                padding: '8px 20px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite', marginRight: 4 }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={13} style={{ marginRight: 4 }} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Plan Drawer ──────────────────────────────────────────────────────────────

function PlanDrawer({ open, onClose, plan, platforms }) {
    const isEdit = !!plan;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        platform_id:    plan?.platform_id   ?? (platforms[0]?.id ?? ''),
        name:           plan?.name          ?? '',
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ flex: 1, background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(8px)', transition: 'all 0.3s' }} onClick={onClose} />
            <div style={{
                width: 600,
                background: '#0b0f19',
                overflowY: 'auto',
                boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative'
            }}>
                {/* Decorative Glowing Edge */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)' }} />

                <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
                            <Layers size={20} color="#818cf8" /> {isEdit ? `Edit Plan: ${plan.name}` : 'Create New Plan'}
                        </h2>
                        <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginTop: 4, display: 'block' }}>Standard-aligned subscription pipeline parameters</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>✕</button>
                </div>

                <form onSubmit={submit} style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Section 1: Basic Info */}
                    <section style={cardSection}>
                        <h3 style={sectionTitle}><Info size={12} /> Basic Config</h3>
                        <div style={grid2}>
                            <Field label="Platform System" error={errors.platform_id}>
                                <select style={input} value={data.platform_id} onChange={e => setData('platform_id', e.target.value)} disabled={isEdit}>
                                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Tier Type" error={errors.type}>
                                <select style={input} value={data.type} onChange={e => setData('type', e.target.value)}>
                                    {['trial','subscription','ltd','enterprise'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div style={grid2}>
                            <Field label="Plan Title" error={errors.name}>
                                <input style={input} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Starter" />
                            </Field>
                            <Field label="Identifier Slug" error={errors.slug}>
                                <input style={input} value={data.slug} onChange={e => setData('slug', e.target.value)} placeholder="e.g. starter" disabled={isEdit} />
                            </Field>
                        </div>
                        <div style={grid3}>
                            <ToggleField label="Featured Tier" value={data.is_featured} onChange={v => setData('is_featured', v)} />
                            <ToggleField label="Active State"   value={data.is_active}   onChange={v => setData('is_active', v)} />
                            <ToggleField label="Visible public"  value={data.is_visible}  onChange={v => setData('is_visible', v)} />
                        </div>
                        <Field label="Sort Priority Order" error={errors.sort_order}>
                            <input style={{ ...input, width: 120 }} type="number" value={data.sort_order} onChange={e => setData('sort_order', +e.target.value)} />
                        </Field>
                    </section>

                    {/* Section 2: Pricing */}
                    <section style={cardSection}>
                        <h3 style={sectionTitle}><Zap size={12} /> Standard Monies (USD)</h3>
                        <div style={grid3}>
                            <Field label="Monthly Rate" error={errors.price_monthly}>
                                <div style={{ position: 'relative' }}>
                                    <span style={inputPrefix}>$</span>
                                    <input style={{ ...input, paddingLeft: 24 }} type="number" step="0.01" value={data.price_monthly} onChange={e => setData('price_monthly', e.target.value)} placeholder="29.00" />
                                </div>
                            </Field>
                            <Field label="Annual Rate" error={errors.price_annual}>
                                <div style={{ position: 'relative' }}>
                                    <span style={inputPrefix}>$</span>
                                    <input style={{ ...input, paddingLeft: 24 }} type="number" step="0.01" value={data.price_annual} onChange={e => setData('price_annual', e.target.value)} placeholder="290.00" />
                                </div>
                            </Field>
                            <Field label="Lifetime (LTD)" error={errors.price_lifetime}>
                                <div style={{ position: 'relative' }}>
                                    <span style={inputPrefix}>$</span>
                                    <input style={{ ...input, paddingLeft: 24 }} type="number" step="0.01" value={data.price_lifetime} onChange={e => setData('price_lifetime', e.target.value)} placeholder="179.00" />
                                </div>
                            </Field>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                            <h4 style={{ ...sectionTitle, color: '#34d399', fontSize: 11, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                🇵🇰 Localized Rupee Pricing (PKR Overrides)
                            </h4>
                            <div style={grid3}>
                                <Field label="Monthly (PKR)" error={errors.price_monthly_pkr}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ ...inputPrefix, color: '#34d399' }}>Rs</span>
                                        <input style={{ ...input, paddingLeft: 30 }} type="number" value={data.price_monthly_pkr} onChange={e => setData('price_monthly_pkr', e.target.value)} placeholder="1100" />
                                    </div>
                                </Field>
                                <Field label="Annual (PKR)" error={errors.price_annual_pkr}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ ...inputPrefix, color: '#34d399' }}>Rs</span>
                                        <input style={{ ...input, paddingLeft: 30 }} type="number" value={data.price_annual_pkr} onChange={e => setData('price_annual_pkr', e.target.value)} placeholder="11000" />
                                    </div>
                                </Field>
                                <Field label="Lifetime (PKR)" error={errors.price_lifetime_pkr}>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ ...inputPrefix, color: '#34d399' }}>Rs</span>
                                        <input style={{ ...input, paddingLeft: 30 }} type="number" value={data.price_lifetime_pkr} onChange={e => setData('price_lifetime_pkr', e.target.value)} placeholder="22120" />
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </section>

                    {/* Section 2.5: Gateway Checkout URLs */}
                    <section style={cardSection}>
                        <h3 style={sectionTitle}><Ticket size={12} /> Lemon Squeezy Gateway Routing</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Field label="Standard Checkout URL (USD)" error={errors.checkout_url_usd}>
                                <input style={input} type="url" value={data.checkout_url_usd} onChange={e => setData('checkout_url_usd', e.target.value)} placeholder="https://checkout.lemonsqueezy.com/buy/..." />
                            </Field>
                            <Field label="Localized Checkout URL (PKR)" error={errors.checkout_url_pkr}>
                                <input style={input} type="url" value={data.checkout_url_pkr} onChange={e => setData('checkout_url_pkr', e.target.value)} placeholder="https://checkout.lemonsqueezy.com/buy/..." />
                            </Field>
                        </div>
                    </section>

                    {/* Section 3: Limits */}
                    <section style={cardSection}>
                        <h3 style={sectionTitle}><Server size={12} /> System Limits & Allowances</h3>
                        <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                        {['System Feature / Key Allowances', 'Max Allowance (blank = ∞)', 'Reset Frequency'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.limits.map((lim, i) => (
                                        <tr key={lim.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '12px 14px', color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{LIMIT_KEYS[i]?.label || lim.key}</td>
                                            <td style={{ padding: '8px 14px' }}>
                                                <input
                                                    style={{ ...input, padding: '6px 12px', fontSize: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                                                    value={lim.value ?? ''}
                                                    placeholder="Unlimited"
                                                    onChange={e => {
                                                        const updated = [...data.limits];
                                                        updated[i] = { ...updated[i], value: e.target.value || null };
                                                        setData('limits', updated);
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '8px 14px' }}>
                                                <select
                                                    style={{ ...input, padding: '6px 12px', fontSize: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
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
                    </section>

                    {/* Section 4: Internal Notes */}
                    <section style={cardSection}>
                        <h3 style={sectionTitle}><Award size={12} /> Executive Internal Notes</h3>
                        <textarea
                            style={{ ...input, height: 80, resize: 'vertical', fontFamily: 'inherit' }}
                            value={data.internal_notes}
                            onChange={e => setData('internal_notes', e.target.value)}
                            placeholder="Notes for the platforms team only. Highly confidential..."
                        />
                    </section>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '12px', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button type="button" onClick={onClose} style={btnSecondary}>Cancel</button>
                        <button type="submit" disabled={processing} style={btnPrimary}>
                            {processing ? 'Saving...' : isEdit ? 'Save Changes' : 'Publish Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PlansIndex({ plans, platforms }) {
    const [activeTab, setActiveTab]   = useState(platforms[0]?.id);
    const [viewMode, setViewMode]     = useState('list');   // 'list' | 'matrix'
    const [drawerPlan, setDrawerPlan] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filteredPlans = plans.filter(p => p.platform_id === activeTab);

    const openCreate  = () => { setDrawerPlan(null); setDrawerOpen(true); };
    const openEdit    = (plan) => { setDrawerPlan(plan); setDrawerOpen(true); };
    const closeDrawer = () => setDrawerOpen(false);

    const duplicate = (plan) => {
        if (confirm(`Duplicate subscription plan "${plan.name}"?`)) {
            router.post(route('platform.plans.duplicate', { plan: plan.id }));
        }
    };

    const destroy = (plan) => {
        if (confirm(`Delete subscription plan "${plan.name}"? This is completely irreversible.`)) {
            router.delete(route('platform.plans.destroy', { plan: plan.id }));
        }
    };

    const archive = (plan) => {
        if (confirm(`Archive subscription plan "${plan.name}"? This will disable it and hide it from signup lists.`)) {
            router.post(route('platform.plans.archive', { plan: plan.id }));
        }
    };

    const unarchive = (plan) => {
        if (confirm(`Unarchive subscription plan "${plan.name}"?`)) {
            router.post(route('platform.plans.unarchive', { plan: plan.id }));
        }
    };

    const toggleActive = (plan) => {
        router.put(route('platform.plans.update', { plan: plan.id }), { is_active: !plan.is_active });
    };

    return (
        <OneGlanceLayout title="SaaS Subscriptions" mode="admin" activeMenu="Plans & Limits">
            <Head title="Plans & Limits | VenQore Platform HQ" />

            <style>{`
                .badge-glass {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#030712', position: 'relative', overflow: 'hidden' }}>

                {/* Background Auroras */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    {/* Page Header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 36 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                                <Activity size={14} /> Monetization Pipeline
                            </div>
                            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em' }}>Subscription Tiers</h1>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, maxWidth: 550, lineHeight: 1.6 }}>
                                Edit limit matrices, toggle features per tier, and configure pricing. Changes propagate instantly to all active tenants.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {/* View Mode Toggle */}
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 3 }}>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        background: viewMode === 'list' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                        color: viewMode === 'list' ? '#a5b4fc' : '#64748b',
                                        border: viewMode === 'list' ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                        padding: '8px 16px', borderRadius: 9,
                                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Table2 size={13} /> Plans List
                                </button>
                                <button
                                    onClick={() => setViewMode('matrix')}
                                    style={{
                                        background: viewMode === 'matrix' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                        color: viewMode === 'matrix' ? '#a5b4fc' : '#64748b',
                                        border: viewMode === 'matrix' ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                        padding: '8px 16px', borderRadius: 9,
                                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Grid3x3 size={13} /> Feature Matrix
                                </button>
                            </div>
                            {viewMode === 'list' && (
                                <button onClick={openCreate} style={btnPrimary}>+ Create New Plan</button>
                            )}
                        </div>
                    </div>

                    {/* Platform Tabs Navigation */}
                    <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 32, paddingBottom: 2 }}>
                        {platforms.map(p => {
                            const isTabActive = activeTab === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setActiveTab(p.id)}
                                    style={{
                                        background: isTabActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                                        border: `1px solid ${isTabActive ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                                        color: isTabActive ? '#a5b4fc' : '#64748b',
                                        padding: '10px 22px',
                                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                                        borderRadius: '12px 12px 0 0',
                                        transition: 'all 0.20s',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}
                                >
                                    <Database size={13} /> {p.name}
                                    <span style={{
                                        marginLeft: 6,
                                        background: isTabActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                        color: isTabActive ? '#c7d2fe' : '#475569',
                                        padding: '2px 8px', borderRadius: 6,
                                        fontSize: 10, fontFamily: 'monospace', fontWeight: 900
                                    }}>
                                        {plans.filter(pl => pl.platform_id === p.id).length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Plans List View ─────────────────────────────────────── */}
                    {viewMode === 'list' && (
                        <div style={{
                            background: 'rgba(30,41,59,0.3)',
                            borderRadius: 24,
                            border: '1px solid rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(12px)',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            {['Subscription Tier', 'Platform Type', 'Standard Pricing', 'Active Stores', 'Key Limits Matrix', 'Visibility', 'Operator Control'].map(h => (
                                                <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: '#94a3b8', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPlans.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '72px 0', textAlign: 'center', color: '#475569', fontSize: 14 }}>
                                                    <LayoutGrid size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                                    No plans registered under this platform yet. Click "+ Create New Plan" to establish one.
                                                </td>
                                            </tr>
                                        ) : filteredPlans.map((plan, i) => (
                                            <tr
                                                key={plan.id}
                                                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s ease' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}
                                            >
                                                <td style={{ padding: '18px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan.is_active ? '#10b981' : '#64748b', boxShadow: plan.is_active ? '0 0 8px #10b981' : 'none', flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 14 }}>{plan.name}</div>
                                                            <div style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: 'monospace' }}>{plan.slug}</div>
                                                        </div>
                                                        {plan.is_featured && <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 9, padding: '2px 8px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.08em' }}><Star size={8} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />FEATURED</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <span style={{ background: planTypeColor(plan.type) + '15', color: planTypeColor(plan.type), border: `1px solid ${planTypeColor(plan.type)}30`, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                                                        {plan.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '18px 20px', color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
                                                    {plan.price_monthly  ? `$${parseFloat(plan.price_monthly).toFixed(0)}/mo` : ''}
                                                    {plan.price_annual   ? ` · $${parseFloat(plan.price_annual).toFixed(0)}/yr` : ''}
                                                    {plan.price_lifetime ? `$${parseFloat(plan.price_lifetime).toFixed(0)} once` : ''}
                                                    {!plan.price_monthly && !plan.price_annual && !plan.price_lifetime ? <span style={{ color: '#475569' }}>—</span> : ''}
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <span style={{ fontWeight: 900, color: plan.active_tenant_count > 0 ? '#10b981' : '#475569', fontSize: 16, fontFamily: 'monospace' }}>
                                                        {plan.active_tenant_count ?? 0}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 400 }}>
                                                        {plan.limits?.slice(0, 4).map(l => (
                                                            <span key={l.key} style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
                                                                {LIMIT_KEYS.find(k => k.key === l.key)?.label.replace(' Integration', '').replace(' AI', '').replace(' Support', '') || l.key}: {l.value ?? '∞'}
                                                            </span>
                                                        ))}
                                                        {plan.limits?.length > 4 && <span style={{ fontSize: 9, color: '#475569', padding: '3px 6px', fontWeight: 700 }}>+{plan.limits.length - 4} more</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    {plan.archived_at ? (
                                                        <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, border: '1px solid rgba(239,68,68,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archived</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleActive(plan)}
                                                            style={{
                                                                background: plan.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                                                                color: plan.is_active ? '#10b981' : '#64748b',
                                                                border: `1px solid ${plan.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                                                padding: '4px 14px', borderRadius: 8,
                                                                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            {plan.is_active ? 'Visible' : 'Hidden'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => openEdit(plan)} style={btnSmall}><Edit3 size={11} /> Edit</button>
                                                        <button onClick={() => duplicate(plan)} style={btnSmall}><Copy size={11} /> Clone</button>
                                                        {plan.archived_at ? (
                                                            <button onClick={() => unarchive(plan)} style={{ ...btnSmall, color: '#10b981', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }} title="Restore Plan">
                                                                Restore
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => archive(plan)} style={{ ...btnSmall, color: '#f59e0b', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }} title="Archive Plan">
                                                                Archive
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => destroy(plan)}
                                                            disabled={plan.active_tenant_count > 0}
                                                            title={plan.active_tenant_count > 0 ? `${plan.active_tenant_count} tenants on this plan` : 'Delete'}
                                                            style={{
                                                                ...btnSmall,
                                                                color: '#ef4444',
                                                                background: 'rgba(239,68,68,0.05)',
                                                                border: '1px solid rgba(239,68,68,0.15)',
                                                                opacity: plan.active_tenant_count > 0 ? 0.3 : 1,
                                                                cursor: plan.active_tenant_count > 0 ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Feature Matrix View ──────────────────────────────────── */}
                    {viewMode === 'matrix' && (
                        filteredPlans.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '72px 0', color: '#475569' }}>
                                <Grid3x3 size={28} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
                                <p>No plans exist for this platform yet. Create a plan first, then return here to configure its feature matrix.</p>
                                <button onClick={() => setViewMode('list')} style={{ ...btnPrimary, marginTop: 16 }}>Go to Plans List</button>
                            </div>
                        ) : (
                            <FeatureMatrix plans={filteredPlans} />
                        )
                    )}
                </div>
            </div>

            <PlanDrawer open={drawerOpen} onClose={closeDrawer} plan={drawerPlan} platforms={platforms} />
        </OneGlanceLayout>
    );
}

// ── Shared Sub-components ─────────────────────────────────────────────────────

function Field({ label, error, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            {children}
            {error && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>{error}</span>}
        </div>
    );
}

function ToggleField({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
            <button
                type="button"
                onClick={() => onChange(!value)}
                style={{
                    background: value ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    color: value ? '#a5b4fc' : '#64748b',
                    border: '1px solid ' + (value ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'),
                    padding: '8px 16px', borderRadius: 10,
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
            >
                {value ? '✓ On' : 'Off'}
            </button>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardSection = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 18, padding: 20,
    display: 'flex', flexDirection: 'column', gap: 16
};

const sectionTitle = {
    margin: '0 0 4px', fontSize: 11, fontWeight: 900,
    color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'flex', alignItems: 'center', gap: 6
};

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };

const input = {
    width: '100%', boxSizing: 'border-box',
    background: '#131924', border: '1px solid rgba(255,255,255,0.08)',
    color: '#f8fafc', padding: '10px 14px',
    borderRadius: 10, fontSize: 13, outline: 'none',
    fontFamily: 'inherit', transition: 'border 0.2s',
};

const inputPrefix = {
    position: 'absolute', left: 12, top: '52%',
    transform: 'translateY(-50%)',
    color: '#475569', fontSize: 13, fontWeight: 700
};

const btnPrimary = {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', padding: '11px 24px',
    borderRadius: 12, fontWeight: 800, fontSize: 13,
    cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
    transition: 'all 0.15s',
};

const btnSecondary = {
    background: 'rgba(255,255,255,0.03)', color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.06)', padding: '10px 22px',
    borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
};

const btnSmall = {
    background: 'rgba(255,255,255,0.03)', color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.05)', padding: '6px 14px',
    borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer',
    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
    transition: 'all 0.15s'
};
