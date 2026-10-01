import React, { useState, useMemo } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    ArrowLeft, Zap, RotateCcw, Clock, CheckCircle, Edit2, X,
    Save, Info, User, Mail, Building2, Calendar, Globe, DollarSign,
    Package, Users, ShoppingCart, Shield, ChevronDown, AlertTriangle,
    Hash, Tag, Plus, Minus, Sparkles, Gift, Layers, Search,
    AlertCircle, RefreshCw, Check, ArrowUpRight
} from 'lucide-react';

// ── V6 Inline Toggle ──────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 focus:outline-none ${
                value ? 'bg-[#0BAA8F]' : 'bg-neutral-700'
            }`}
        >
            <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                    value ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

// ── Field Row (label + editable value) ─────────────────────────────────────────
function FieldRow({ label, icon: Icon, children }) {
    return (
        <div className="flex items-start gap-4 py-3.5 border-b border-white/[0.05] last:border-0">
            <div className="flex items-center gap-2 w-48 shrink-0 pt-1">
                {Icon && <Icon size={14} className="text-neutral-400 shrink-0" />}
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function EditableText({ value, onChange, placeholder, type = 'text' }) {
    return (
        <input
            type={type}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F] focus:border-[#0BAA8F] transition-all placeholder:text-neutral-600"
        />
    );
}

function EditableSelect({ value, onChange, options }) {
    return (
        <select
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F] transition-all"
        >
            {options.map(o => (
                <option key={o.value} value={o.value} className="bg-neutral-900 text-white">
                    {o.label}
                </option>
            ))}
        </select>
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
        <div className={`rounded-2xl border p-4 transition-all ${
            hasOverride
                ? (isCurrentlyBelow ? 'bg-amber-500/10 border-amber-500/40' : 'bg-[#0BAA8F]/5 border-[#0BAA8F]/30')
                : 'bg-neutral-900/90 border-white/[0.08] hover:border-white/20'
        }`}>
            {/* Header & Badges */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-neutral-300 font-bold uppercase tracking-wider truncate" title={limitKey}>
                    {limitKey}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                    {hasOverride ? (
                        <>
                            {isCurrentlyBelow ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase" title="This override restricts tenant below plan default!">
                                    <AlertTriangle size={10} className="text-amber-400" /> Below Plan
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#0BAA8F] bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 px-2 py-0.5 rounded-full uppercase">
                                    <Zap size={10} /> Override
                                </span>
                            )}
                            <button
                                onClick={removeOverride}
                                className="p-1 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Revert to plan default"
                            >
                                <RotateCcw size={12} />
                            </button>
                        </>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase">
                            <CheckCircle size={10} /> Plan Default
                        </span>
                    )}
                </div>
            </div>

            {!editing ? (
                <div className="flex items-end justify-between mt-1">
                    <div>
                        <div className="text-2xl font-bold font-mono tracking-tight text-white">{displayValue}</div>
                        {hasOverride && (
                            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                                <span>Base default:</span>
                                <span className="font-mono text-neutral-200 font-bold">
                                    {info.plan_default === null ? '∞' : String(info.plan_default)}
                                </span>
                            </div>
                        )}
                        {info.reason && <p className="text-xs text-neutral-400 mt-1 italic">{info.reason}</p>}
                        {info.expires_at && (
                            <div className="flex items-center gap-1 text-xs text-amber-400 mt-1 font-medium">
                                <Clock size={11} /> Expires {new Date(info.expires_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setData('override_value', info.override !== null && info.override !== undefined ? String(info.override) : (info.plan_default !== null ? String(info.plan_default) : ''));
                            setEditing(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-[#0BAA8F] hover:bg-[#0BAA8F]/10 rounded-xl transition-all"
                        title="Adjust value"
                    >
                        <Edit2 size={14} />
                    </button>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-3 mt-3 pt-3 border-t border-white/10">
                    {/* Stepper & Input */}
                    <div>
                        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                            <span>Override Value (blank = unlimited)</span>
                            <span className="font-mono text-neutral-500">
                                Base: {info.plan_default === null ? '∞' : String(info.plan_default)}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => adjustValue(-10)}
                                className="px-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-neutral-300"
                                title="Decrease by 10"
                            >
                                -10
                            </button>
                            <button
                                type="button"
                                onClick={() => adjustValue(-1)}
                                className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-neutral-300"
                                title="Decrease by 1"
                            >
                                -1
                            </button>
                            <input
                                type="text"
                                value={data.override_value}
                                onChange={e => setData('override_value', e.target.value)}
                                placeholder="Value (blank = ∞)"
                                className="flex-1 bg-neutral-950 border border-white/20 rounded-xl px-3 py-2 text-sm font-mono text-white text-center focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                            />
                            <button
                                type="button"
                                onClick={() => adjustValue(1)}
                                className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]"
                                title="Increase by 1"
                            >
                                +1
                            </button>
                            <button
                                type="button"
                                onClick={() => adjustValue(10)}
                                className="px-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]"
                                title="Increase by 10"
                            >
                                +10
                            </button>
                        </div>
                    </div>

                    {/* Quick Boolean buttons if key represents a boolean feature */}
                    {(info.plan_default === '0' || info.plan_default === '1' || info.plan_default === false || info.plan_default === true) && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setData('override_value', '1')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    data.override_value === '1'
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                                }`}
                            >
                                ✓ Enabled (1)
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('override_value', '0')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    data.override_value === '0'
                                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                                }`}
                            >
                                ✕ Disabled (0)
                            </button>
                        </div>
                    )}

                    {/* Real-time Below Plan Level Warning Banner */}
                    {isBelowWarning && (
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-pulse">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                            <div>
                                <span className="font-bold">⚠️ Warning: Below Base Plan Level!</span>
                                <p className="mt-0.5 text-amber-300/90 leading-relaxed">
                                    You entered <strong className="text-white font-mono">{data.override_value}</strong>, which is <strong>LOWER</strong> than the tenant's base plan default (<strong className="text-white font-mono">{info.plan_default ?? '∞'}</strong>). This restricts the tenant below their purchased plan tier.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* LTD Warning Banner (F15) */}
                    {isLtdSkuWarning && (
                        <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-xs flex items-start gap-2">
                            <AlertCircle size={15} className="shrink-0 mt-0.5 text-purple-400" />
                            <div>
                                <span className="font-bold">LTD Tier Notice:</span> SKU limit is an anchor for LTD classification. Overriding it may shift tier calculation if snapshots are incomplete.
                            </div>
                        </div>
                    )}

                    <input
                        type="text"
                        value={data.reason}
                        onChange={e => setData('reason', e.target.value)}
                        placeholder="Reason (e.g. VIP loyalty upgrade, promo, support ticket)"
                        className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                    />

                    <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-neutral-500 shrink-0" />
                        <input
                            type="datetime-local"
                            value={data.expires_at}
                            onChange={e => setData('expires_at', e.target.value)}
                            className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                            title="Optional Expiry Date"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0BAA8F] hover:bg-[#09927b] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0BAA8F]/20 disabled:opacity-50"
                        >
                            <Save size={12} /> {processing ? 'Saving…' : 'Save Override'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEditing(false); reset(); }}
                            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-all"
                        >
                            <X size={12} />
                        </button>
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
        return (available_keys || []).filter(k => k.toLowerCase().includes(q)).slice(0, 30);
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
        const list = (plans || []).map(p => ({
            value: p.slug,
            label: p.display_name || p.name || p.slug,
        }));
        // Retain legacy options if the tenant currently has one
        const hasCurrent = list.some(o => o.value === tenant.plan);
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

    const statusColor = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        trial:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
        suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    const activeOverrides = (override_history || []).filter(
        o => !o.expires_at || new Date(o.expires_at) > new Date()
    );

    // Count below plan overrides
    const belowPlanCount = Object.values(effective_limits || {}).filter(info => info.is_below).length;

    return (
        <OneGlanceLayout title={`Store — ${tenant.name}`} mode="admin" activeMenu="Tenant Overrides">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

                {/* Breadcrumb & Title */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-2">
                            <Link
                                href={route('platform.tenants.overrides')}
                                className="hover:text-[#0BAA8F] transition-colors flex items-center gap-1"
                            >
                                <ArrowLeft size={14} /> Tenant Overrides
                            </Link>
                            <span>/</span>
                            <span className="text-white font-mono">{tenant.slug}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span>{tenant.name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border uppercase ${statusColor[tenant.status] || 'bg-neutral-800 text-neutral-300'}`}>
                                {tenant.status}
                            </span>
                        </h1>
                    </div>

                    {/* Overall Below-Plan Notice Badge */}
                    {belowPlanCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                            <span>{belowPlanCount} limit{belowPlanCount > 1 ? 's are' : ' is'} set BELOW base plan level!</span>
                        </div>
                    )}
                </div>

                {/* Flash Notice */}
                {flash?.success && (
                    <div className="flex items-center gap-3 p-4 bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 rounded-2xl text-[#0BAA8F] text-sm font-semibold">
                        <CheckCircle size={18} /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-sm font-semibold">
                        <AlertTriangle size={18} /> {flash.error}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* ── LEFT COLUMN: Profile & Add-on Management (7 cols) ── */}
                    <div className="xl:col-span-7 space-y-8">

                        {/* 1. Add-on Grant & Management Panel (F8) */}
                        <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 flex items-center justify-center text-[#0BAA8F]">
                                        <Gift size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">Add-on Packs & Entitlements</h3>
                                        <p className="text-xs text-neutral-400 mt-0.5">Grant official add-on packages with grouped limits in one click</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-[#0BAA8F] bg-[#0BAA8F]/10 border border-[#0BAA8F]/20 px-2.5 py-1 rounded-full">
                                    F8 Universal Add-ons
                                </span>
                            </div>

                            {/* Grant Add-on Form */}
                            <form onSubmit={handleGrantAddon} className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-white/[0.05]">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                                            Select Add-on Product
                                        </label>
                                        <select
                                            value={addonSlug}
                                            onChange={e => setAddonSlug(e.target.value)}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                        >
                                            <option value="">-- Choose Add-on Package --</option>
                                            {Object.entries(addons_catalogue || {}).map(([slug, details]) => (
                                                <option key={slug} value={slug}>
                                                    {details.name} ({details.price_formatted || `$${details.price}/mo`})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                                            Quantity
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={addonQty}
                                                onChange={e => setAddonQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-center text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Add-on Details Preview */}
                                {selectedAddonDetails && (
                                    <div className="p-3 bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 rounded-xl text-xs space-y-1.5">
                                        <div className="flex items-center justify-between text-[#0BAA8F] font-bold">
                                            <span>{selectedAddonDetails.name} × {addonQty}</span>
                                            <span>Unlocks {Object.keys(selectedAddonDetails.entitlements || {}).length} entitlement(s)</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {Object.entries(selectedAddonDetails.entitlements || {}).map(([k, v]) => (
                                                <span key={k} className="font-mono text-[11px] bg-neutral-950/80 text-neutral-300 px-2 py-0.5 rounded border border-white/10">
                                                    {k.startsWith('+') ? `${k} (+${Number(v) * addonQty})` : `${k} = ${v}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-400 mb-1">
                                            Optional Expiry Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={addonExpiry}
                                            onChange={e => setAddonExpiry(e.target.value)}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-400 mb-1">
                                            Custom Note / Reason
                                        </label>
                                        <input
                                            type="text"
                                            value={addonReason}
                                            onChange={e => setAddonReason(e.target.value)}
                                            placeholder={`Default: add-on: ${addonSlug || '...'} x${addonQty}`}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!addonSlug || submittingAddon}
                                    className="w-full py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> {submittingAddon ? 'Applying Add-on…' : `Grant ${selectedAddonDetails ? selectedAddonDetails.name : 'Add-on'} Pack`}
                                </button>
                            </form>

                            {/* Active Add-on Packs List */}
                            <div className="mt-5 pt-5 border-t border-white/[0.08]">
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                                    Active Add-on Packages ({active_addons?.length || 0})
                                </h4>
                                {(!active_addons || active_addons.length === 0) ? (
                                    <p className="text-xs text-neutral-500 italic">No add-on packs currently assigned to this store.</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {active_addons.map((pack) => (
                                            <div
                                                key={pack.reason}
                                                className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/90 border border-white/10"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold font-mono text-[#0BAA8F]">{pack.reason}</span>
                                                        {pack.expires_at && (
                                                            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full">
                                                                Expires {new Date(pack.expires_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        {pack.keys.map(k => (
                                                            <span key={k.id} className="text-[11px] font-mono text-neutral-300 bg-white/5 px-2 py-0.5 rounded">
                                                                {k.key}: <strong className="text-white">{k.value ?? '∞'}</strong>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeAddon(pack.reason)}
                                                    disabled={revokingReason === pack.reason}
                                                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold transition-all shrink-0 ml-3"
                                                >
                                                    {revokingReason === pack.reason ? 'Revoking…' : 'Revoke Pack'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Store Profile & Plan Identity Form */}
                        <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.08]">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">Store Profile & Plan Assignment</h3>
                                    <p className="text-xs text-neutral-400 mt-0.5">Switch plans, adjust subscription dates, and toggle store configurations</p>
                                </div>
                            </div>

                            <form onSubmit={saveProfile} className="space-y-1">
                                <FieldRow label="Store Name" icon={Building2}>
                                    <EditableText value={data.name} onChange={v => setData('name', v)} placeholder="Store name" />
                                </FieldRow>
                                <FieldRow label="Owner" icon={User}>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-white font-semibold">{tenant.owner_name}</span>
                                        <span className="text-xs text-neutral-400">{tenant.owner_email}</span>
                                    </div>
                                </FieldRow>
                                <FieldRow label="Store ID / Slug" icon={Tag}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-[#0BAA8F]">#{tenant.id}</span>
                                        <span className="text-xs font-mono text-neutral-400">{tenant.slug}</span>
                                    </div>
                                </FieldRow>
                                <FieldRow label="Industry" icon={Package}>
                                    <EditableText value={data.industry} onChange={v => setData('industry', v)} placeholder="e.g. Retail, Fashion, Cafe" />
                                </FieldRow>

                                {/* Plan & Billing */}
                                <div className="pt-4 pb-2 border-t border-white/[0.08] flex items-center gap-2">
                                    <Shield size={14} className="text-[#0BAA8F]" />
                                    <span className="text-xs font-bold text-[#0BAA8F] uppercase tracking-wider">Plan & Subscription</span>
                                </div>
                                <FieldRow label="Assigned Plan" icon={Shield}>
                                    <EditableSelect value={data.plan} onChange={v => setData('plan', v)} options={planOptions} />
                                </FieldRow>
                                <FieldRow label="Account Status" icon={CheckCircle}>
                                    <EditableSelect value={data.status} onChange={v => setData('status', v)} options={statusOptions} />
                                </FieldRow>
                                <FieldRow label="Trial End Date" icon={Calendar}>
                                    <EditableText type="date" value={data.trial_ends_at} onChange={v => setData('trial_ends_at', v)} />
                                </FieldRow>
                                <FieldRow label="Subscription End" icon={Calendar}>
                                    <EditableText type="date" value={data.subscription_ends_at} onChange={v => setData('subscription_ends_at', v)} />
                                </FieldRow>

                                {/* Locale */}
                                <div className="pt-4 pb-2 border-t border-white/[0.08] flex items-center gap-2">
                                    <Globe size={14} className="text-sky-400" />
                                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Localization</span>
                                </div>
                                <FieldRow label="Timezone" icon={Globe}>
                                    <EditableText value={data.timezone} onChange={v => setData('timezone', v)} placeholder="e.g. Asia/Karachi, UTC" />
                                </FieldRow>
                                <FieldRow label="Currency Code" icon={DollarSign}>
                                    <EditableText value={data.currency_code} onChange={v => setData('currency_code', v)} placeholder="PKR, USD" />
                                </FieldRow>
                                <FieldRow label="Currency Symbol" icon={DollarSign}>
                                    <EditableText value={data.currency_symbol} onChange={v => setData('currency_symbol', v)} placeholder="Rs, $" />
                                </FieldRow>

                                {/* Feature Toggles */}
                                <div className="pt-4 pb-2 border-t border-white/[0.08] flex items-center gap-2">
                                    <Zap size={14} className="text-amber-400" />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Inventory Modules</span>
                                </div>
                                {[
                                    { key: 'feature_variants',      label: 'Product Variants' },
                                    { key: 'feature_serials',       label: 'Serial Number Tracking' },
                                    { key: 'feature_batches',       label: 'Batch & Expiry Tracking' },
                                    { key: 'feature_manufacturing', label: 'Manufacturing & Recipes' },
                                ].map(({ key, label }) => (
                                    <FieldRow key={key} label={label}>
                                        <div className="flex items-center gap-3">
                                            <Toggle value={data[key]} onChange={v => setData(key, v)} />
                                            <span className={`text-xs font-bold ${data[key] ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                                {data[key] ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </FieldRow>
                                ))}

                                <div className="pt-6 border-t border-white/[0.08] flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={14} /> {processing ? 'Saving Changes…' : 'Save Store Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 3. Override History Audit Table */}
                        <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-neutral-400" />
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Override History & Audit Log</h3>
                                </div>
                                <span className="text-xs text-neutral-400 font-mono">
                                    {override_history?.length || 0} event{override_history?.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {(!override_history || override_history.length === 0) ? (
                                <p className="text-xs text-neutral-500 italic py-4 text-center">No overrides recorded yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider text-left">
                                                <th className="py-2 px-3">Key</th>
                                                <th className="py-2 px-3">Value</th>
                                                <th className="py-2 px-3">Original</th>
                                                <th className="py-2 px-3">Reason</th>
                                                <th className="py-2 px-3">Status</th>
                                                <th className="py-2 px-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.05]">
                                            {override_history.map((o) => {
                                                const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
                                                return (
                                                    <tr key={o.id} className={isExpired ? 'opacity-40' : 'hover:bg-white/[0.02]'}>
                                                        <td className="py-2.5 px-3 font-mono font-bold text-[#0BAA8F]">{o.override_key}</td>
                                                        <td className="py-2.5 px-3 font-mono font-bold text-white">{o.override_value ?? '∞'}</td>
                                                        <td className="py-2.5 px-3 font-mono text-neutral-400">{o.original_value ?? '—'}</td>
                                                        <td className="py-2.5 px-3 text-neutral-300 max-w-[140px] truncate">{o.reason || '—'}</td>
                                                        <td className="py-2.5 px-3">
                                                            {isExpired ? (
                                                                <span className="text-rose-400 font-medium">Expired</span>
                                                            ) : o.expires_at ? (
                                                                <span className="text-amber-400 font-medium">Till {new Date(o.expires_at).toLocaleDateString()}</span>
                                                            ) : (
                                                                <span className="text-emerald-400 font-medium">Active</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            {!isExpired && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Revert ${o.override_key} override?`)) {
                                                                            router.delete(route('platform.tenants.overrides.remove', { tenant: tenant.id, override: o.id }));
                                                                        }
                                                                    }}
                                                                    className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[11px] font-bold transition-all"
                                                                >
                                                                    Revert
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

                    {/* ── RIGHT COLUMN: Quick Override & Limit Matrix (5 cols) ── */}
                    <div className="xl:col-span-5 space-y-6">

                        {/* Live Metrics Summary */}
                        <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Live Tenant Usage</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Staff', value: tenant.staff_count, icon: Users, color: 'text-sky-400' },
                                    { label: 'Products', value: tenant.product_count, icon: Package, color: 'text-emerald-400' },
                                    { label: 'Sales', value: tenant.sales_count, icon: ShoppingCart, color: 'text-amber-400' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="bg-neutral-900/80 rounded-xl p-3 text-center border border-white/[0.05]">
                                        <Icon size={16} className={`${color} mx-auto mb-1`} />
                                        <div className="text-xl font-bold font-mono text-white">{value}</div>
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Arbitrary Key Override Creator (F12, F13) */}
                        <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className="text-[#0BAA8F]" />
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Grant Any Feature / Override</h3>
                            </div>
                            <p className="text-xs text-neutral-400 mb-4">
                                Grant any of the 227 canonical capabilities or custom limits to this store.
                            </p>

                            <form onSubmit={handleApplyCustomOverride} className="space-y-3">
                                {/* Searchable Key Filter */}
                                <div>
                                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                                        Select Capability / Limit Key
                                    </label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-2.5 text-neutral-500" />
                                        <input
                                            type="text"
                                            value={keySearch}
                                            onChange={e => setKeySearch(e.target.value)}
                                            placeholder="Search all 227 canonical keys (e.g. multi_branch, locations)..."
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                        />
                                    </div>
                                    <select
                                        value={selectedKey}
                                        onChange={e => {
                                            const k = e.target.value;
                                            setSelectedKey(k);
                                            const meta = available_keys_metadata?.[k];
                                            if (meta && meta.plan_default !== null) {
                                                setCustomValue(String(meta.plan_default));
                                            } else {
                                                setCustomValue('');
                                            }
                                        }}
                                        className="w-full mt-1.5 bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                    >
                                        <option value="">-- Choose Key to Override ({filteredAvailableKeys.length} matching) --</option>
                                        {filteredAvailableKeys.map(k => {
                                            const meta = available_keys_metadata?.[k];
                                            const defStr = meta?.plan_default === null ? '∞' : (meta?.plan_default ?? 'not in plan');
                                            return (
                                                <option key={k} value={k}>
                                                    {k} (Base: {defStr})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {selectedKey && (
                                    <div className="p-3 bg-neutral-900/90 rounded-xl border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-mono font-bold text-[#0BAA8F]">{selectedKey}</span>
                                            <span className="text-neutral-400">
                                                Base default: <strong className="text-white font-mono">{selectedKeyMeta?.plan_default ?? 'None'}</strong>
                                            </span>
                                        </div>

                                        {/* Steppers & Value */}
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = Number(customValue) || 0;
                                                        setCustomValue(String(Math.max(0, cur - 1)));
                                                    }}
                                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-neutral-300"
                                                >
                                                    -1
                                                </button>
                                                <input
                                                    type="text"
                                                    value={customValue}
                                                    onChange={e => setCustomValue(e.target.value)}
                                                    placeholder="Value (blank = ∞)"
                                                    className="flex-1 bg-neutral-950 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white text-center focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = Number(customValue) || 0;
                                                        setCustomValue(String(cur + 1));
                                                    }}
                                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]"
                                                >
                                                    +1
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = Number(customValue) || 0;
                                                        setCustomValue(String(cur + 10));
                                                    }}
                                                    className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]"
                                                >
                                                    +10
                                                </button>
                                            </div>
                                        </div>

                                        {/* Boolean quick buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCustomValue('1')}
                                                className="flex-1 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                            >
                                                ✓ Enable (1)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCustomValue('0')}
                                                className="flex-1 py-1 text-xs font-bold rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                            >
                                                ✕ Disable (0)
                                            </button>
                                        </div>

                                        {/* Real-time Warning Banner */}
                                        {customIsBelowWarning && (
                                            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                                                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                                                <div>
                                                    <span className="font-bold">Below Base Plan Warning:</span> The value <strong>{customValue}</strong> is lower than the base plan level (<strong>{selectedKeyMeta?.plan_default ?? '∞'}</strong>).
                                                </div>
                                            </div>
                                        )}

                                        <input
                                            type="text"
                                            value={customReason}
                                            onChange={e => setCustomReason(e.target.value)}
                                            placeholder="Reason for granting this override"
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                        />

                                        <input
                                            type="datetime-local"
                                            value={customExpiry}
                                            onChange={e => setCustomExpiry(e.target.value)}
                                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                                            title="Optional Expiry"
                                        />

                                        <button
                                            type="submit"
                                            disabled={submittingCustom}
                                            className="w-full py-2 bg-[#0BAA8F] hover:bg-[#09927b] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                                        >
                                            {submittingCustom ? 'Applying…' : `Apply Override for ${selectedKey}`}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Limit Cards Matrix */}
                        <div className="bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2.5">
                                    <Zap size={16} className="text-[#0BAA8F]" />
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Effective Plan Limits</h3>
                                </div>
                                <span className="text-xs font-mono text-neutral-400">
                                    {Object.keys(effective_limits || {}).length} configured
                                </span>
                            </div>

                            <div className="p-4 space-y-3 max-h-[750px] overflow-y-auto">
                                {Object.entries(effective_limits || {}).map(([key, info]) => (
                                    <LimitCard
                                        key={key}
                                        limitKey={key}
                                        info={info}
                                        tenant={tenant}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </OneGlanceLayout>
    );
}
