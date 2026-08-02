import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { vq } from '@/theme/runtime';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell

// ── Override Apply Drawer ─────────────────────────────────────────────────────

function OverrideDrawer({ open, tenant, availableKeys, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        override_key:          '',
        override_value:        '',
        reason:                '',
        expires_at:            '',
        notify_user:           true,
        notification_message:  '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.tenants.overrides.apply', { tenant: tenant.id }), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    if (!open) return null;

    return (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
            <div style={{ flex:1, background:'rgba(0,0,0,0.5)' }} onClick={onClose} />
            <div style={{ width:500, background:vq.slate[900], overflowY:'auto', boxShadow:'-4px 0 32px rgba(0,0,0,0.5)' }}>
                <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                        <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:vq.slate[100] }}>Apply Override</h2>
                        <p style={{ margin:'4px 0 0', fontSize:13, color:vq.slate[500] }}>{tenant.name} · Plan: <b style={{color:vq.slate[400]}}>{tenant.plan}</b></p>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', color:vq.slate[400], fontSize:22, cursor:'pointer' }}>✕</button>
                </div>
                <form onSubmit={submit} style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ background:vq.slate[800], borderRadius:10, padding:'12px 14px', fontSize:13, color:vq.slate[400] }}>
                        <b style={{color:vq.amber[500]}}>⚡ Live Override</b> — This change takes effect immediately and invalidates the cache. The tenant will be able to use the new limit right away.
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12 }}>
                        <Field label="Limit Key" error={errors.override_key}>
                            <select style={inp} value={data.override_key} onChange={e => setData('override_key', e.target.value)}>
                                <option value="">-- Select --</option>
                                {availableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </Field>
                        <Field label="New Value (blank = unlimited)" error={errors.override_value}>
                            <input style={inp} value={data.override_value} onChange={e => setData('override_value', e.target.value)} placeholder="unlimited" />
                        </Field>
                    </div>

                    <Field label="Reason (internal — not shown to tenant)" error={errors.reason}>
                        <input style={inp} value={data.reason} onChange={e => setData('reason', e.target.value)} placeholder="e.g. Sales concession, AppSumo special deal" />
                    </Field>

                    <Field label="Expires At (blank = permanent)" error={errors.expires_at}>
                        <input style={inp} type="datetime-local" value={data.expires_at} onChange={e => setData('expires_at', e.target.value)} />
                    </Field>

                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                            <input type="checkbox" checked={data.notify_user} onChange={e => setData('notify_user', e.target.checked)} />
                            <span style={{ fontSize:14, color:vq.slate[400] }}>Send in-app notification to tenant</span>
                        </label>

                        {data.notify_user && (
                            <Field label="Custom Notification Message (optional)" error={errors.notification_message}>
                                <textarea
                                    style={{ ...inp, height:80, resize:'vertical', fontFamily:'inherit' }}
                                    value={data.notification_message}
                                    onChange={e => setData('notification_message', e.target.value)}
                                    placeholder="Leave blank for auto-generated message..."
                                />
                            </Field>
                        )}
                    </div>

                    <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingTop:16, borderTop:'1px solid #1e293b' }}>
                        <button type="button" onClick={onClose} style={btnSec}>Cancel</button>
                        <button type="submit" disabled={processing || !data.override_key} style={btnPri}>
                            {processing ? 'Applying…' : '⚡ Apply Override'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantOverrides({ tenants, filters }) {
    const [drawerTenant, setDrawerTenant] = useState(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const doSearch = (e) => {
        e.preventDefault();
        router.get(route('platform.tenants.overrides'), { search }, { preserveState: true });
    };

    const removeOverride = (tenantId, overrideId) => {
        if (confirm('Remove this override? The tenant reverts to the plan default immediately.')) {
            router.delete(route('platform.tenants.overrides.remove', { tenant: tenantId, override: overrideId }));
        }
    };

    return (
        <OneGlanceLayout title="Tenant Overrides" mode="admin" activeMenu="Tenant Overrides">
            <div style={{ padding:'32px 40px', minHeight:'100vh', background:vq.slate[950] }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
                    <div>
                        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:vq.slate[100] }}>Tenant Overrides</h1>
                        <p style={{ margin:'4px 0 0', color:vq.slate[500], fontSize:14 }}>
                            Apply per-tenant limit overrides. These take priority over any plan default.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={doSearch} style={{ display:'flex', gap:10, marginBottom:24 }}>
                    <input
                        style={{ ...inp, maxWidth:400 }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by store name or slug…"
                    />
                    <button type="submit" style={btnPri}>Search</button>
                    {filters.search && (
                        <button type="button" onClick={() => router.get(route('platform.tenants.overrides'))} style={btnSec}>
                            Clear
                        </button>
                    )}
                </form>

                {/* Tenants Table */}
                <div style={{ background:vq.slate[900], borderRadius:16, border:'1px solid #1e293b', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                        <thead>
                            <tr style={{ background:vq.slate[800] }}>
                                {['Store','Plan','Status','Active Overrides','Actions'].map(h => (
                                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:vq.slate[500], fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding:'48px 0', textAlign:'center', color:vq.slate[600] }}>
                                        No tenants found.
                                    </td>
                                </tr>
                            ) : tenants.data?.map((tenant, i) => (
                                <tr
                                    key={tenant.id}
                                    style={{ borderTop: i > 0 ? '1px solid #1e293b' : 'none' }}
                                    onMouseEnter={e => e.currentTarget.style.background = vq.slate[900]}
                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                >
                                    <td style={{ padding:'14px 16px' }}>
                                        <div style={{ fontWeight:700, color:vq.slate[100] }}>{tenant.name}</div>
                                        <div style={{ fontSize:11, color:vq.slate[600] }}>ID #{tenant.id}</div>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <span style={{ background:vq.indigo[500], color:vq.indigo[500], padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600 }}>
                                            {tenant.plan}
                                        </span>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <span style={{
                                            background: tenant.status === 'active' ? vq.green[500] : vq.amber[500],
                                            color: tenant.status === 'active' ? vq.green[500] : vq.amber[500],
                                            padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:700,
                                        }}>
                                            {tenant.status}
                                        </span>
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        {tenant.plan_overrides?.length > 0 ? (
                                            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                                {tenant.plan_overrides.map(o => (
                                                    <span key={o.id} style={{
                                                        background:vq.amber[500], color:vq.amber[500],
                                                        padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700,
                                                        display:'flex', alignItems:'center', gap:4,
                                                    }}>
                                                        {o.override_key}: {o.override_value ?? '∞'}
                                                        <button
                                                            onClick={() => removeOverride(tenant.id, o.id)}
                                                            style={{ background:'none', border:'none', color:vq.amber[500], cursor:'pointer', fontSize:14, padding:0, marginLeft:2 }}
                                                            title="Remove override"
                                                        >×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ color:vq.slate[600], fontSize:12 }}>No overrides</span>
                                        )}
                                    </td>
                                    <td style={{ padding:'14px 16px' }}>
                                        <div style={{ display:'flex', gap:6 }}>
                                            <button
                                                onClick={() => setDrawerTenant(tenant)}
                                                style={btnSmall}
                                            >
                                                + Override
                                            </button>
                                            <Link
                                                href={route('platform.tenants.overrides.show', { tenant: tenant.id })}
                                                style={{ ...btnSmall, textDecoration:'none' }}
                                            >
                                                Detail →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {tenants.last_page > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:24 }}>
                        {Array.from({ length: tenants.last_page }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => router.get(route('platform.tenants.overrides'), { search, page })}
                                style={{
                                    background: page === tenants.current_page ? vq.indigo[500] : vq.slate[800],
                                    color: page === tenants.current_page ? '#fff' : vq.slate[400],
                                    border: '1px solid #334155', padding:'6px 14px',
                                    borderRadius:8, fontWeight:600, cursor:'pointer',
                                }}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {drawerTenant && (
                <OverrideDrawer
                    open={!!drawerTenant}
                    tenant={drawerTenant}
                    availableKeys={['transactions_per_month','sku_limit','locations','staff_limit','woocommerce','api_access','growth_engine','multi_branch','reports']}
                    onClose={() => setDrawerTenant(null)}
                />
            )}
        </OneGlanceLayout>
    );
}

const Field = ({ label, error, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <label style={{ fontSize:12, color:vq.slate[500], fontWeight:600 }}>{label}</label>
        {children}
        {error && <span style={{ fontSize:11, color:vq.red[500] }}>{error}</span>}
    </div>
);

const inp = {
    width:'100%', boxSizing:'border-box',
    background:vq.slate[800], border:'1px solid #334155',
    color:vq.slate[100], padding:'8px 12px',
    borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit',
};

const btnPri = {
    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color:'#fff', border:'none', padding:'10px 22px',
    borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
    whiteSpace:'nowrap',
};

const btnSec = {
    background:vq.slate[800], color:vq.slate[400],
    border:'1px solid #334155', padding:'9px 20px',
    borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer',
};

const btnSmall = {
    background:vq.slate[800], color:vq.slate[400],
    border:'1px solid #334155', padding:'5px 12px',
    borderRadius:7, fontWeight:600, fontSize:12, cursor:'pointer',
    whiteSpace:'nowrap',
};
