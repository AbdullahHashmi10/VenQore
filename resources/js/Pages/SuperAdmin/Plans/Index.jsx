import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

// ── Value display helpers ────────────────────────────────────────────────────

const LIMIT_KEYS = [
    { key: 'transactions_per_month', label: 'Transactions / Month', reset: 'monthly' },
    { key: 'sku_limit',              label: 'SKU / Product Limit',   reset: 'never'   },
    { key: 'locations',              label: 'Warehouse Locations',   reset: 'never'   },
    { key: 'staff_limit',            label: 'Staff Seats',           reset: 'never'   },
    { key: 'woocommerce',            label: 'WooCommerce',           reset: 'never'   },
    { key: 'api_access',             label: 'API Access',            reset: 'never'   },
    { key: 'growth_engine',          label: 'Growth Engine',         reset: 'never'   },
    { key: 'multi_branch',           label: 'Multi-Branch',          reset: 'never'   },
    { key: 'reports',                label: 'Reports Level',         reset: 'never'   },
];

const displayValue = (v) => {
    if (v === null || v === undefined || v === '') return <span className="badge-unlimited">Unlimited</span>;
    if (v === '0' || v === false) return <span className="badge-off">Disabled</span>;
    if (v === '1' || v === true) return <span className="badge-on">✓ Enabled</span>;
    return <span className="badge-val">{v}</span>;
};

const planTypeColor = (type) => ({
    trial: '#6366f1', subscription: '#0ea5e9', ltd: '#f59e0b', enterprise: '#10b981'
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
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
            <div style={{ flex:1, background:'rgba(0,0,0,0.5)' }} onClick={onClose} />
            <div style={{
                width: 560, background:'#0f172a', overflowY:'auto',
                boxShadow:'-4px 0 32px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column',
            }}>
                <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#f1f5f9' }}>
                        {isEdit ? `Edit: ${plan.name}` : 'New Plan'}
                    </h2>
                    <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:22, cursor:'pointer' }}>✕</button>
                </div>

                <form onSubmit={submit} style={{ flex:1, padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>
                    {/* Section 1: Basic Info */}
                    <section>
                        <h3 style={sectionTitle}>Basic Info</h3>
                        <div style={grid2}>
                            <Field label="Platform" error={errors.platform_id}>
                                <select style={input} value={data.platform_id} onChange={e => setData('platform_id', e.target.value)} disabled={isEdit}>
                                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Type" error={errors.type}>
                                <select style={input} value={data.type} onChange={e => setData('type', e.target.value)}>
                                    {['trial','subscription','ltd','enterprise'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div style={grid2}>
                            <Field label="Name" error={errors.name}>
                                <input style={input} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Starter" />
                            </Field>
                            <Field label="Slug" error={errors.slug}>
                                <input style={input} value={data.slug} onChange={e => setData('slug', e.target.value)} placeholder="starter" disabled={isEdit} />
                            </Field>
                        </div>
                        <div style={grid3}>
                            <ToggleField label="Featured" value={data.is_featured} onChange={v => setData('is_featured', v)} />
                            <ToggleField label="Active"   value={data.is_active}   onChange={v => setData('is_active', v)} />
                            <ToggleField label="Visible"  value={data.is_visible}  onChange={v => setData('is_visible', v)} />
                        </div>
                        <Field label="Sort Order" error={errors.sort_order}>
                            <input style={{...input, width:100}} type="number" value={data.sort_order} onChange={e => setData('sort_order', +e.target.value)} />
                        </Field>
                    </section>

                    {/* Section 2: Pricing */}
                    <section>
                        <h3 style={sectionTitle}>Pricing (USD)</h3>
                        <div style={grid3}>
                            <Field label="Monthly $" error={errors.price_monthly}>
                                <input style={input} type="number" step="0.01" value={data.price_monthly} onChange={e => setData('price_monthly', e.target.value)} placeholder="19.00" />
                            </Field>
                            <Field label="Annual $" error={errors.price_annual}>
                                <input style={input} type="number" step="0.01" value={data.price_annual} onChange={e => setData('price_annual', e.target.value)} placeholder="190.00" />
                            </Field>
                            <Field label="Lifetime $" error={errors.price_lifetime}>
                                <input style={input} type="number" step="0.01" value={data.price_lifetime} onChange={e => setData('price_lifetime', e.target.value)} placeholder="49.00" />
                            </Field>
                        </div>
                    </section>

                    {/* Section 3: Limits */}
                    <section>
                        <h3 style={sectionTitle}>Limits</h3>
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                                <thead>
                                    <tr style={{ borderBottom:'1px solid #1e293b' }}>
                                        {['Feature','Value (blank = unlimited)','Reset'].map(h => (
                                            <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:'#64748b', fontWeight:600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.limits.map((lim, i) => (
                                        <tr key={lim.key} style={{ borderBottom:'1px solid #0f172a' }}>
                                            <td style={{ padding:'6px 8px', color:'#94a3b8', fontSize:12 }}>{LIMIT_KEYS[i]?.label || lim.key}</td>
                                            <td style={{ padding:'4px 8px' }}>
                                                <input
                                                    style={{ ...input, padding:'4px 8px', fontSize:12 }}
                                                    value={lim.value ?? ''}
                                                    placeholder="unlimited"
                                                    onChange={e => {
                                                        const updated = [...data.limits];
                                                        updated[i] = { ...updated[i], value: e.target.value || null };
                                                        setData('limits', updated);
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding:'4px 8px' }}>
                                                <select
                                                    style={{ ...input, padding:'4px 8px', fontSize:12 }}
                                                    value={lim.reset_period}
                                                    onChange={e => {
                                                        const updated = [...data.limits];
                                                        updated[i] = { ...updated[i], reset_period: e.target.value };
                                                        setData('limits', updated);
                                                    }}
                                                >
                                                    {['never','monthly','annually'].map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 4: Internal Notes */}
                    <section>
                        <h3 style={sectionTitle}>Internal Notes</h3>
                        <textarea
                            style={{ ...input, height:80, resize:'vertical', fontFamily:'inherit' }}
                            value={data.internal_notes}
                            onChange={e => setData('internal_notes', e.target.value)}
                            placeholder="Notes for the admin team only..."
                        />
                    </section>

                    <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:'auto', paddingTop:16, borderTop:'1px solid #1e293b' }}>
                        <button type="button" onClick={onClose} style={btnSecondary}>Cancel</button>
                        <button type="submit" disabled={processing} style={btnPrimary}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Plan'}
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
        if (confirm(`Duplicate "${plan.name}"?`)) {
            router.post(route('platform.plans.duplicate', { plan: plan.id }));
        }
    };

    const destroy = (plan) => {
        if (confirm(`Delete "${plan.name}"? This is irreversible.`)) {
            router.delete(route('platform.plans.destroy', { plan: plan.id }));
        }
    };

    const toggleActive = (plan) => {
        router.put(route('platform.plans.update', { plan: plan.id }), { is_active: !plan.is_active });
    };

    return (
        <OneGlanceLayout title="Subscription Plans" mode="admin" activeMenu="Plans & Limits">
            <style>{styles}</style>

            <div style={{ padding:'32px 40px', minHeight:'100vh', background:'#020617' }}>
                {/* Page Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
                    <div>
                        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.5px' }}>Plan Management</h1>
                        <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>
                            Edit limits and pricing — changes are live immediately across all tenants.
                        </p>
                    </div>
                    <button onClick={openCreate} style={btnPrimary}>+ New Plan</button>
                </div>

                {/* Platform Tabs */}
                <div style={{ display:'flex', gap:2, borderBottom:'1px solid #1e293b', marginBottom:28 }}>
                    {platforms.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            style={{
                                background: activeTab === p.id ? '#1e293b' : 'none',
                                border: 'none',
                                color: activeTab === p.id ? '#f1f5f9' : '#64748b',
                                padding: '10px 20px',
                                fontSize: 14,
                                fontWeight: activeTab === p.id ? 700 : 500,
                                cursor: 'pointer',
                                borderRadius: '8px 8px 0 0',
                                transition: 'all 0.15s',
                            }}
                        >
                            {p.name}
                            <span style={{ marginLeft:8, background:'#0f172a', color:'#94a3b8', padding:'2px 8px', borderRadius:99, fontSize:11 }}>
                                {plans.filter(pl => pl.platform_id === p.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Plans Table */}
                <div style={{ background:'#0f172a', borderRadius:16, border:'1px solid #1e293b', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                        <thead>
                            <tr style={{ background:'#1e293b' }}>
                                {['Plan','Type','Price','Tenants','Limits (key facts)','Active','Actions'].map(h => (
                                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#64748b', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlans.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding:'48px 0', textAlign:'center', color:'#475569' }}>
                                        No plans on this platform yet. Click "+ New Plan" to create one.
                                    </td>
                                </tr>
                            ) : filteredPlans.map((plan, i) => (
                                <tr
                                    key={plan.id}
                                    style={{
                                        borderTop: i > 0 ? '1px solid #1e293b' : 'none',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#131c2e'}
                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                >
                                    <td style={{ padding:'14px 16px' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                            <div style={{ width:8, height:8, borderRadius:'50%', background: plan.is_active ? '#22c55e' : '#475569', flexShrink:0 }} />
                                            <div>
                                                <div style={{ fontWeight:700, color:'#f1f5f9' }}>{plan.name}</div>
                                                <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>{plan.slug}</div>
                                            </div>
                                            {plan.is_featured && <span style={{ background:'#fbbf24', color:'#000', fontSize:10, padding:'2px 6px', borderRadius:99, fontWeight:800 }}>★ FEATURED</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <span style={{ background: planTypeColor(plan.type) + '22', color: planTypeColor(plan.type), padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600 }}>
                                            {plan.type}
                                        </span>
                                    </td>
                                    <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                                        {plan.price_monthly  ? `$${plan.price_monthly}/mo`    : ''}
                                        {plan.price_annual   ? ` · $${plan.price_annual}/yr`   : ''}
                                        {plan.price_lifetime ? `$${plan.price_lifetime} once`  : ''}
                                        {!plan.price_monthly && !plan.price_annual && !plan.price_lifetime ? '—' : ''}
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <span style={{ fontWeight:700, color: plan.active_tenant_count > 0 ? '#22c55e' : '#64748b', fontSize:18 }}>
                                            {plan.active_tenant_count ?? 0}
                                        </span>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                            {plan.limits?.slice(0, 4).map(l => (
                                                <span key={l.key} style={{ fontSize:11, color:'#64748b', background:'#1e293b', padding:'2px 6px', borderRadius:4 }}>
                                                    {l.key.replace(/_/g,' ')}: {l.value ?? '∞'}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <button
                                            onClick={() => toggleActive(plan)}
                                            style={{
                                                background: plan.is_active ? '#22c55e22' : '#47556922',
                                                color: plan.is_active ? '#22c55e' : '#64748b',
                                                border:'none', padding:'4px 12px', borderRadius:99,
                                                fontSize:12, fontWeight:700, cursor:'pointer',
                                            }}
                                        >
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <div style={{ display:'flex', gap:6 }}>
                                            <button onClick={() => openEdit(plan)} style={btnSmall}>Edit</button>
                                            <button onClick={() => duplicate(plan)} style={btnSmall}>Clone</button>
                                            <button
                                                onClick={() => destroy(plan)}
                                                disabled={plan.active_tenant_count > 0}
                                                title={plan.active_tenant_count > 0 ? `${plan.active_tenant_count} tenants on this plan` : 'Delete'}
                                                style={{ ...btnSmall, color:'#ef4444', opacity: plan.active_tenant_count > 0 ? 0.4 : 1 }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PlanDrawer open={drawerOpen} onClose={closeDrawer} plan={drawerPlan} platforms={platforms} />
        </OneGlanceLayout>
    );
}

// ── Small components ─────────────────────────────────────────────────────────

function Field({ label, error, children }) {
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>{label}</label>
            {children}
            {error && <span style={{ fontSize:11, color:'#ef4444' }}>{error}</span>}
        </div>
    );
}

function ToggleField({ label, value, onChange }) {
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>{label}</label>
            <button
                type="button"
                onClick={() => onChange(!value)}
                style={{
                    background: value ? '#22c55e22' : '#1e293b',
                    color: value ? '#22c55e' : '#64748b',
                    border: '1px solid ' + (value ? '#22c55e44' : '#334155'),
                    padding: '6px 14px', borderRadius:8, fontSize:13,
                    fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                }}
            >
                {value ? '✓ On' : 'Off'}
            </button>
        </div>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const input = {
    width: '100%', boxSizing:'border-box',
    background:'#1e293b', border:'1px solid #334155',
    color:'#f1f5f9', padding:'8px 12px',
    borderRadius:8, fontSize:14, outline:'none',
    fontFamily:'inherit',
};

const btnPrimary = {
    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color:'#fff', border:'none', padding:'10px 22px',
    borderRadius:10, fontWeight:700, fontSize:14,
    cursor:'pointer', boxShadow:'0 4px 16px rgba(99,102,241,0.3)',
    transition:'all 0.15s',
};

const btnSecondary = {
    background:'#1e293b', color:'#94a3b8',
    border:'1px solid #334155', padding:'9px 20px',
    borderRadius:10, fontWeight:600, fontSize:14,
    cursor:'pointer',
};

const btnSmall = {
    background:'#1e293b', color:'#94a3b8',
    border:'1px solid #334155', padding:'5px 12px',
    borderRadius:7, fontWeight:600, fontSize:12,
    cursor:'pointer', whiteSpace:'nowrap',
};

const sectionTitle = {
    margin:'0 0 12px', fontSize:13, fontWeight:700,
    color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px',
};

const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 };
const grid3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 };

const styles = `
    .badge-unlimited { background:#6366f122; color:#6366f1; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
    .badge-off       { background:#ef444422; color:#ef4444; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
    .badge-on        { background:#22c55e22; color:#22c55e; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
    .badge-val       { background:#0ea5e922; color:#0ea5e9; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700; }
`;
