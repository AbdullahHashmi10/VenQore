import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

// ── Coupon List Entry ─────────────────────────────────────────────────────────

function CouponRow({ coupon, i }) {
    const isValid = coupon.is_active &&
        (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) &&
        (!coupon.max_uses || coupon.used_count < coupon.max_uses);

    const toggle = () => {
        router.put(route('platform.coupons.update', { coupon: coupon.id }), { is_active: !coupon.is_active });
    };

    return (
        <tr
            style={{ borderTop: i > 0 ? '1px solid #1e293b' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#131c2e'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
        >
            <td style={{ padding:'14px 16px' }}>
                <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:15, color:'#f1f5f9', letterSpacing:1 }}>
                    {coupon.code}
                </div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{coupon.name}</div>
            </td>
            <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                {coupon.max_discount ? ` (max $${coupon.max_discount})` : ''}
            </td>
            <td style={{ padding:'14px 16px' }}>
                <span style={{
                    background: coupon.applies_to === 'all' ? '#6366f122' : '#f59e0b22',
                    color: coupon.applies_to === 'all' ? '#6366f1' : '#f59e0b',
                    padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600,
                }}>
                    {coupon.applies_to}
                </span>
            </td>
            <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                {coupon.used_count} / {coupon.max_uses ?? '∞'}
            </td>
            <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:12 }}>
                <div>{coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : 'Now'}</div>
                <div>{coupon.valid_until ? '→ ' + new Date(coupon.valid_until).toLocaleDateString() : '(no end)'}</div>
            </td>
            <td style={{ padding:'14px 16px' }}>
                <span style={{
                    background: isValid ? '#22c55e22' : '#ef444422',
                    color: isValid ? '#22c55e' : '#ef4444',
                    padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:700,
                }}>
                    {isValid ? '✓ Valid' : '✗ Invalid'}
                </span>
            </td>
            <td style={{ padding:'14px 16px' }}>
                <button
                    onClick={toggle}
                    style={{
                        background: coupon.is_active ? '#22c55e22' : '#47556922',
                        color: coupon.is_active ? '#22c55e' : '#64748b',
                        border: 'none', padding:'4px 12px', borderRadius:99,
                        fontSize:12, fontWeight:700, cursor:'pointer',
                    }}
                >
                    {coupon.is_active ? 'Active' : 'Inactive'}
                </button>
            </td>
        </tr>
    );
}

// ── New Coupon Form ────────────────────────────────────────────────────────────

function CouponForm({ onClose, plans }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        max_discount: '',
        applies_to: 'all',
        platform_id: '',
        max_uses: '',
        max_uses_per_user: 1,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        plan_ids: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.coupons.store'), { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
            <div style={{ flex:1, background:'rgba(0,0,0,0.5)' }} onClick={onClose} />
            <div style={{ width: 520, background:'#0f172a', overflowY:'auto', boxShadow:'-4px 0 32px rgba(0,0,0,0.5)' }}>
                <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#f1f5f9' }}>New Coupon</h2>
                    <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:22, cursor:'pointer' }}>✕</button>
                </div>

                <form onSubmit={submit} style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <Field label="Code" error={errors.code}>
                            <input style={inp} value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())} placeholder="WELCOME30" />
                        </Field>
                        <Field label="Name" error={errors.name}>
                            <input style={inp} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Welcome 30% Off" />
                        </Field>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <Field label="Discount Type" error={errors.discount_type}>
                            <select style={inp} value={data.discount_type} onChange={e => setData('discount_type', e.target.value)}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed ($)</option>
                            </select>
                        </Field>
                        <Field label={data.discount_type === 'percentage' ? 'Discount %' : 'Discount $'} error={errors.discount_value}>
                            <input style={inp} type="number" step="0.01" value={data.discount_value} onChange={e => setData('discount_value', e.target.value)} placeholder="30" />
                        </Field>
                    </div>

                    <Field label="Applies To" error={errors.applies_to}>
                        <select style={inp} value={data.applies_to} onChange={e => setData('applies_to', e.target.value)}>
                            {['all','subscription','ltd','specific_plans'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </Field>

                    {data.applies_to === 'specific_plans' && (
                        <Field label="Restrict to Plans" error={errors.plan_ids}>
                            <div style={{ display:'flex', flexDirection:'column', gap:6, background:'#1e293b', borderRadius:8, padding:12 }}>
                                {plans.map(p => (
                                    <label key={p.id} style={{ display:'flex', alignItems:'center', gap:8, color:'#94a3b8', fontSize:13, cursor:'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={data.plan_ids.includes(p.id)}
                                            onChange={e => {
                                                if (e.target.checked) setData('plan_ids', [...data.plan_ids, p.id]);
                                                else setData('plan_ids', data.plan_ids.filter(id => id !== p.id));
                                            }}
                                        />
                                        {p.platform?.name} – {p.name}
                                    </label>
                                ))}
                            </div>
                        </Field>
                    )}

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <Field label="Max Uses (total)" error={errors.max_uses}>
                            <input style={inp} type="number" value={data.max_uses} onChange={e => setData('max_uses', e.target.value)} placeholder="unlimited" />
                        </Field>
                        <Field label="Max Per User" error={errors.max_uses_per_user}>
                            <input style={inp} type="number" value={data.max_uses_per_user} onChange={e => setData('max_uses_per_user', +e.target.value)} />
                        </Field>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <Field label="Valid From" error={errors.valid_from}>
                            <input style={inp} type="date" value={data.valid_from} onChange={e => setData('valid_from', e.target.value)} />
                        </Field>
                        <Field label="Valid Until (blank = forever)" error={errors.valid_until}>
                            <input style={inp} type="date" value={data.valid_until} onChange={e => setData('valid_until', e.target.value)} />
                        </Field>
                    </div>

                    <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingTop:16, borderTop:'1px solid #1e293b' }}>
                        <button type="button" onClick={onClose} style={btnSec}>Cancel</button>
                        <button type="submit" disabled={processing} style={btnPri}>
                            {processing ? 'Creating…' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CouponsIndex({ coupons, plans }) {
    const [showForm, setShowForm] = useState(false);

    return (
        <OneGlanceLayout title="Coupon Management" mode="admin" activeMenu="Coupons">
            <div style={{ padding:'32px 40px', minHeight:'100vh', background:'#020617' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
                    <div>
                        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Coupon Management</h1>
                        <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>
                            Create and manage discount codes for subscriptions and lifetime deals.
                        </p>
                    </div>
                    <button onClick={() => setShowForm(true)} style={btnPri}>+ New Coupon</button>
                </div>

                {/* Stats bar */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:28 }}>
                    {[
                        { label:'Total Coupons',   value: coupons.length },
                        { label:'Active Now',       value: coupons.filter(c => c.is_active).length, color:'#22c55e' },
                        { label:'Total Redemptions', value: coupons.reduce((s, c) => s + (c.redemptions_count || 0), 0), color:'#6366f1' },
                        { label:'Expiring Soon',    value: coupons.filter(c => c.valid_until && new Date(c.valid_until) < new Date(Date.now() + 14*86400000)).length, color:'#f59e0b' },
                    ].map(stat => (
                        <div key={stat.label} style={{ background:'#0f172a', borderRadius:12, border:'1px solid #1e293b', padding:'16px 20px' }}>
                            <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>{stat.label}</div>
                            <div style={{ fontSize:24, fontWeight:800, color: stat.color || '#f1f5f9' }}>{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{ background:'#0f172a', borderRadius:16, border:'1px solid #1e293b', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                        <thead>
                            <tr style={{ background:'#1e293b' }}>
                                {['Code','Discount','Applies To','Uses','Validity','Valid?','Status'].map(h => (
                                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#64748b', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding:'48px 0', textAlign:'center', color:'#475569' }}>
                                        No coupons yet. Create your first one!
                                    </td>
                                </tr>
                            ) : coupons.map((c, i) => <CouponRow key={c.id} coupon={c} i={i} />)}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && <CouponForm onClose={() => setShowForm(false)} plans={plans} />}
        </OneGlanceLayout>
    );
}

const Field = ({ label, error, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <label style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>{label}</label>
        {children}
        {error && <span style={{ fontSize:11, color:'#ef4444' }}>{error}</span>}
    </div>
);

const inp = {
    width:'100%', boxSizing:'border-box',
    background:'#1e293b', border:'1px solid #334155',
    color:'#f1f5f9', padding:'8px 12px',
    borderRadius:8, fontSize:14, outline:'none',
};

const btnPri = {
    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color:'#fff', border:'none', padding:'10px 22px',
    borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
};

const btnSec = {
    background:'#1e293b', color:'#94a3b8',
    border:'1px solid #334155', padding:'9px 20px',
    borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer',
};
