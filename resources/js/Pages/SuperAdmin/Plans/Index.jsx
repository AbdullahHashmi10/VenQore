import React, { useState } from 'react';
import { router, useForm, Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    Layers, Zap, Database, Ticket, ShoppingBag, 
    UserCog, CheckCircle, XCircle, Star, Edit3, 
    Copy, Trash2, ArrowUpRight, Shield, Activity, 
    Info, Award, Server, LayoutGrid 
} from 'lucide-react';

// ── Value display helpers ────────────────────────────────────────────────────

const LIMIT_KEYS = [
    { key: 'transactions_per_month', label: 'Transactions / Month', reset: 'monthly' },
    { key: 'sku_limit',              label: 'SKU / Product Limit',   reset: 'never'   },
    { key: 'locations',              label: 'Warehouse Locations',   reset: 'never'   },
    { key: 'staff_limit',            label: 'Staff Seats',           reset: 'never'   },
    { key: 'woocommerce',            label: 'WooCommerce Integration', reset: 'never'   },
    { key: 'api_access',             label: 'API Access Key',        reset: 'never'   },
    { key: 'growth_engine',          label: 'Growth Engine AI',      reset: 'never'   },
    { key: 'multi_branch',           label: 'Multi-Branch Support',  reset: 'never'   },
    { key: 'reports',                label: 'Reports Complexity',    reset: 'never'   },
];

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
    const [activeTab, setActiveTab]  = useState(platforms[0]?.id);
    const [drawerPlan, setDrawerPlan] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filteredPlans = plans.filter(p => p.platform_id === activeTab);

    const openCreate = () => { setDrawerPlan(null); setDrawerOpen(true); };
    const openEdit   = (plan) => { setDrawerPlan(plan); setDrawerOpen(true); };
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
                @keyframes sweep {
                    0% { transform: translate(-100%, -100%) rotate(45deg); }
                    100% { transform: translate(100%, 100%) rotate(45deg); }
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
                                Edit limit matrices, unlock capabilities, and configure standard pricing tiers. Changes propagate instantly to all active tenants.
                            </p>
                        </div>
                        <button onClick={openCreate} style={btnPrimary}>+ Create New Plan</button>
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
                                        fontSize: 13,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        borderRadius: '12px 12px 0 0',
                                        transition: 'all 0.20s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <Database size={13} /> {p.name}
                                    <span style={{ 
                                        marginLeft: 6, 
                                        background: isTabActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', 
                                        color: isTabActive ? '#c7d2fe' : '#475569', 
                                        padding: '2px 8px', 
                                        borderRadius: 6, 
                                        fontSize: 10,
                                        fontFamily: 'monospace',
                                        fontWeight: 900
                                    }}>
                                        {plans.filter(pl => pl.platform_id === p.id).length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Plans Grid / Table Matrix */}
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
                                            style={{
                                                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                transition: 'background 0.15s ease',
                                            }}
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
                                                    {plan.is_featured && <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: 9, padding: '2px 8px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.08em' }}><Star size={8} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> FEATURED</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <span style={{ 
                                                    background: planTypeColor(plan.type) + '15', 
                                                    color: planTypeColor(plan.type), 
                                                    border: `1px solid ${planTypeColor(plan.type)}30`,
                                                    padding: '3px 10px', 
                                                    borderRadius: 8, 
                                                    fontSize: 11, 
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase'
                                                }}>
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
                                                <button
                                                    onClick={() => toggleActive(plan)}
                                                    style={{
                                                        background: plan.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                                                        color: plan.is_active ? '#10b981' : '#64748b',
                                                        border: `1px solid ${plan.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`, 
                                                        padding: '4px 14px', 
                                                        borderRadius: 8,
                                                        fontSize: 11, 
                                                        fontWeight: 800, 
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {plan.is_active ? 'Visible' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => openEdit(plan)} style={btnSmall}><Edit3 size={11} /> Edit</button>
                                                    <button onClick={() => duplicate(plan)} style={btnSmall}><Copy size={11} /> Clone</button>
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
                </div>
            </div>

            <PlanDrawer open={drawerOpen} onClose={closeDrawer} plan={drawerPlan} platforms={platforms} />
        </OneGlanceLayout>
    );
}

// ── Shared Sub-styles & components ───────────────────────────────────────────

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
                    padding: '8px 16px', 
                    borderRadius: 10, 
                    fontSize: 12,
                    fontWeight: 800, 
                    cursor: 'pointer', 
                    transition: 'all 0.15s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}
            >
                {value ? '✓ On' : 'Off'}
            </button>
        </div>
    );
}

// Styles
const cardSection = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
};

const sectionTitle = {
    margin: '0 0 4px', 
    fontSize: 11, 
    fontWeight: 900,
    color: '#818cf8', 
    textTransform: 'uppercase', 
    letterSpacing: '0.1em',
    display: 'flex',
    alignItems: 'center',
    gap: 6
};

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };

const input = {
    width: '100%', 
    boxSizing: 'border-box',
    background: '#131924', 
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f8fafc', 
    padding: '10px 14px',
    borderRadius: 10, 
    fontSize: 13, 
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border 0.2s',
};

const inputPrefix = {
    position: 'absolute',
    left: 12,
    top: '52%',
    transform: 'translateY(-50%)',
    color: '#475569',
    fontSize: 13,
    fontWeight: 700
};

const btnPrimary = {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', 
    border: 'none', 
    padding: '11px 24px',
    borderRadius: 12, 
    fontWeight: 800, 
    fontSize: 13,
    cursor: 'pointer', 
    boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
    transition: 'all 0.15s',
};

const btnSecondary = {
    background: 'rgba(255,255,255,0.03)', 
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.06)', 
    padding: '10px 22px',
    borderRadius: 12, 
    fontWeight: 700, 
    fontSize: 13,
    cursor: 'pointer',
};

const btnSmall = {
    background: 'rgba(255,255,255,0.03)', 
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.05)', 
    padding: '6px 14px',
    borderRadius: 8, 
    fontWeight: 700, 
    fontSize: 11,
    cursor: 'pointer', 
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.15s'
};
