import React, { useState } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ArrowLeft, Zap, RotateCcw, Clock, CheckCircle, Edit2, X,
    Save, Info, User, Mail, Building2, Calendar, Globe, DollarSign,
    Package, Users, ShoppingCart, Shield, ToggleLeft, ToggleRight,
    ChevronDown, AlertTriangle, Infinity, Hash, Tag
} from 'lucide-react';

// ── Inline Toggle ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
    return (
        <button type="button" onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 ${value ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

// ── Field Row (label + editable value) ───────────────────────────────────────
function FieldRow({ label, icon: Icon, children }) {
    return (
        <div className="flex items-start gap-4 py-3.5 border-b border-slate-800/60 last:border-0">
            <div className="flex items-center gap-2 w-48 shrink-0 pt-0.5">
                {Icon && <Icon size={14} className="text-slate-500 shrink-0" />}
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function EditableText({ value, onChange, placeholder, type = 'text' }) {
    return (
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
    );
}

function EditableSelect({ value, onChange, options }) {
    return (
        <select value={value ?? ''} onChange={e => onChange(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

// ── Override Inline Form ─────────────────────────────────────────────────────
function LimitCard({ limitKey, info, tenant, availableKeys }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        override_key: limitKey,
        override_value: info.override ?? '',
        reason: info.reason ?? '',
        expires_at: '',
        notify_user: false,
        notification_message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.tenants.overrides.apply', { tenant: tenant.id }), {
            onSuccess: () => { reset(); setEditing(false); },
        });
    };

    const removeOverride = () => {
        if (info.override_id && confirm('Remove this override? Tenant reverts to plan default.')) {
            router.delete(route('platform.tenants.overrides.remove', { tenant: tenant.id, override: info.override_id }));
        }
    };

    const hasOverride = info.override !== null && info.override !== undefined;
    const displayValue = info.effective === null ? '∞' : String(info.effective);

    return (
        <div className={`rounded-2xl border p-4 transition-all ${hasOverride ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">{limitKey}</span>
                <div className="flex items-center gap-1.5">
                    {hasOverride ? (
                        <>
                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                                <Zap size={9} /> Override
                            </span>
                            <button onClick={removeOverride} className="p-1 text-red-500/60 hover:text-red-400 transition-colors" title="Remove override">
                                <RotateCcw size={12} />
                            </button>
                        </>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                            <CheckCircle size={9} /> Plan Default
                        </span>
                    )}
                </div>
            </div>

            {!editing ? (
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-2xl font-black text-white">{displayValue}</div>
                        {hasOverride && (
                            <div className="text-xs text-slate-600 mt-0.5">
                                Plan default: <span className="text-slate-500">{info.plan_default === null ? '∞' : String(info.plan_default)}</span>
                            </div>
                        )}
                        {info.reason && <p className="text-xs text-amber-400/60 mt-1">{info.reason}</p>}
                        {info.expires_at && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                                <Clock size={10} /> Expires {new Date(info.expires_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setEditing(true)}
                        className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all" title="Edit">
                        <Edit2 size={13} />
                    </button>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-2 mt-2">
                    <input type="text" value={data.override_value} onChange={e => setData('override_value', e.target.value)}
                        placeholder="Value (blank = unlimited)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="text" value={data.reason} onChange={e => setData('reason', e.target.value)}
                        placeholder="Reason (internal)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="datetime-local" value={data.expires_at} onChange={e => setData('expires_at', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="flex gap-2">
                        <button type="submit" disabled={processing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                            <Save size={12} /> {processing ? 'Saving…' : 'Apply'}
                        </button>
                        <button type="button" onClick={() => { setEditing(false); reset(); }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
                            <X size={12} />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OverrideDetail({ tenant, effective_limits, override_history, available_keys }) {
    const { flash } = usePage().props;

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
        patch(route('platform.tenants.overrides.update', { tenant: tenant.id }));
    };

    const activeOverrides = override_history.filter(o => !o.expires_at || new Date(o.expires_at) > new Date());

    const planOptions = [
        { value: 'trial', label: 'Trial' },
        { value: 'starter', label: 'Starter' },
        { value: 'growth', label: 'Growth / Professional' },
        { value: 'business', label: 'Business / Enterprise' },
        { value: 'ltd_1', label: 'LTD — 1 Code (Starter)' },
        { value: 'ltd_2', label: 'LTD — 2 Codes (Growth)' },
        { value: 'ltd_3', label: 'LTD — 3 Codes (Business)' },
    ];

    const statusOptions = [
        { value: 'trial', label: 'Trial' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const statusColor = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        trial:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
        suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <OneGlanceLayout title={`Store — ${tenant.name}`} mode="admin" activeMenu="Tenant Overrides">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-6">
                <Link href={route('platform.tenants.overrides')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors font-semibold text-sm">
                    <ArrowLeft size={16} /> Tenant Overrides
                </Link>
                <span className="text-slate-700">/</span>
                <span className="text-slate-300 font-bold">{tenant.name}</span>
            </div>

            {/* Flash */}
            {flash?.success && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-semibold">
                    <CheckCircle size={16} /> {flash.success}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── LEFT: Full Tenant Profile Form ── */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Identity Card */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
                            <Building2 size={16} className="text-indigo-400" />
                            <h3 className="font-black text-white text-sm uppercase tracking-widest">Store Identity</h3>
                        </div>
                        <form onSubmit={saveProfile} className="px-6 py-2">
                            <FieldRow label="Store Name" icon={Building2}>
                                <EditableText value={data.name} onChange={v => setData('name', v)} placeholder="Store name" />
                            </FieldRow>
                            <FieldRow label="Owner" icon={User}>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm text-white font-semibold">{tenant.owner_name}</span>
                                    <span className="text-xs text-slate-500">{tenant.owner_email}</span>
                                </div>
                            </FieldRow>
                            <FieldRow label="Store ID" icon={Hash}>
                                <span className="text-sm text-slate-400 font-mono">#{tenant.id}</span>
                            </FieldRow>
                            <FieldRow label="Slug" icon={Tag}>
                                <span className="text-sm text-slate-400 font-mono">{tenant.slug}</span>
                            </FieldRow>
                            <FieldRow label="Industry" icon={Building2}>
                                <EditableText value={data.industry} onChange={v => setData('industry', v)} placeholder="e.g. Retail, Fashion, F&B" />
                            </FieldRow>

                            {/* Billing */}
                            <div className="flex items-center gap-3 mt-4 mb-2 pt-4 border-t border-slate-800">
                                <DollarSign size={14} className="text-emerald-400" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Billing & Plan</span>
                            </div>
                            <FieldRow label="Plan" icon={Shield}>
                                <EditableSelect value={data.plan} onChange={v => setData('plan', v)} options={planOptions} />
                            </FieldRow>
                            <FieldRow label="Status" icon={CheckCircle}>
                                <EditableSelect value={data.status} onChange={v => setData('status', v)} options={statusOptions} />
                            </FieldRow>
                            <FieldRow label="Trial Ends" icon={Calendar}>
                                <EditableText type="date" value={data.trial_ends_at} onChange={v => setData('trial_ends_at', v)} />
                            </FieldRow>
                            <FieldRow label="Subscription Ends" icon={Calendar}>
                                <EditableText type="date" value={data.subscription_ends_at} onChange={v => setData('subscription_ends_at', v)} />
                            </FieldRow>

                            {/* Locale */}
                            <div className="flex items-center gap-3 mt-4 mb-2 pt-4 border-t border-slate-800">
                                <Globe size={14} className="text-sky-400" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Locale & Currency</span>
                            </div>
                            <FieldRow label="Timezone" icon={Globe}>
                                <EditableText value={data.timezone} onChange={v => setData('timezone', v)} placeholder="e.g. Asia/Karachi" />
                            </FieldRow>
                            <FieldRow label="Currency Code" icon={DollarSign}>
                                <EditableText value={data.currency_code} onChange={v => setData('currency_code', v)} placeholder="e.g. PKR, USD" />
                            </FieldRow>
                            <FieldRow label="Currency Symbol" icon={DollarSign}>
                                <EditableText value={data.currency_symbol} onChange={v => setData('currency_symbol', v)} placeholder="e.g. ₨, $" />
                            </FieldRow>

                            {/* Feature Flags */}
                            <div className="flex items-center gap-3 mt-4 mb-2 pt-4 border-t border-slate-800">
                                <Zap size={14} className="text-amber-400" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Feature Flags</span>
                            </div>
                            {[
                                { key: 'feature_variants',      label: 'Product Variants' },
                                { key: 'feature_serials',       label: 'Serial Number Tracking' },
                                { key: 'feature_batches',       label: 'Batch / Expiry Tracking' },
                                { key: 'feature_manufacturing', label: 'Manufacturing Module' },
                            ].map(({ key, label }) => (
                                <FieldRow key={key} label={label}>
                                    <div className="flex items-center gap-3">
                                        <Toggle value={data[key]} onChange={v => setData(key, v)} />
                                        <span className={`text-xs font-bold ${data[key] ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {data[key] ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </FieldRow>
                            ))}

                            <div className="pt-5 pb-4 border-t border-slate-800 mt-4">
                                <button type="submit" disabled={processing}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm">
                                    <Save size={15} /> {processing ? 'Saving…' : 'Save All Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Override History */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
                            <Clock size={16} className="text-slate-400" />
                            <h3 className="font-black text-white text-sm uppercase tracking-widest">Override History</h3>
                        </div>
                        {override_history.length === 0 ? (
                            <div className="p-12 text-center">
                                <Info size={32} className="mx-auto mb-3 text-slate-700" />
                                <p className="text-slate-600 font-medium">No overrides applied yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-800/50">
                                            {['Key', 'Value', 'Original', 'Reason', 'Expires', ''].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {override_history.map((o, i) => {
                                            const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
                                            return (
                                                <tr key={o.id} className={`border-t border-slate-800 ${isExpired ? 'opacity-40' : 'hover:bg-slate-800/30'}`}>
                                                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{o.override_key}</td>
                                                    <td className="px-4 py-3 font-bold text-white">{o.override_value ?? <span className="text-slate-500">∞</span>}</td>
                                                    <td className="px-4 py-3 text-slate-500">{o.original_value ?? '—'}</td>
                                                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{o.reason || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        {o.expires_at ? (
                                                            <span className={`text-xs font-semibold ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                                                                {isExpired ? 'Expired · ' : ''}{new Date(o.expires_at).toLocaleDateString()}
                                                            </span>
                                                        ) : <span className="text-xs text-emerald-400 font-semibold">Permanent</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {!isExpired && (
                                                            <button onClick={() => {
                                                                if (confirm('Remove override?')) {
                                                                    router.delete(route('platform.tenants.overrides.remove', { tenant: tenant.id, override: o.id }));
                                                                }
                                                            }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all">
                                                                <RotateCcw size={11} /> Revert
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Stats + Limit Cards ── */}
                <div className="space-y-6">

                    {/* Quick Stats */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Live Usage</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Staff', value: tenant.staff_count, icon: Users, color: 'text-indigo-400' },
                                { label: 'Products', value: tenant.product_count, icon: Package, color: 'text-emerald-400' },
                                { label: 'Sales', value: tenant.sales_count, icon: ShoppingCart, color: 'text-amber-400' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="bg-slate-800/60 rounded-2xl p-3 text-center">
                                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                                    <div className="text-xl font-black text-white">{value}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">{label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase ${statusColor[tenant.status] ?? 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {tenant.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-black border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase">
                                {tenant.plan}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-black border bg-slate-800 text-slate-400 border-slate-700">
                                {activeOverrides.length} active override{activeOverrides.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Effective Limits — all editable inline */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
                            <Zap size={15} className="text-amber-400" />
                            <h3 className="font-black text-white text-sm uppercase tracking-widest">Plan Limits</h3>
                            <span className="ml-auto text-xs text-slate-600 font-semibold">{Object.keys(effective_limits).length} keys</span>
                        </div>
                        <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
                            {Object.entries(effective_limits).map(([key, info]) => (
                                <LimitCard
                                    key={key}
                                    limitKey={key}
                                    info={info}
                                    tenant={tenant}
                                    availableKeys={available_keys}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
