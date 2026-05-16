import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ArrowLeft, Zap, RotateCcw, Clock, CheckCircle,
    AlertTriangle, Edit2, X, Save, Info
} from 'lucide-react';

// ── Apply / Edit Override Drawer ─────────────────────────────────────────────

function OverrideDrawer({ open, tenant, availableKeys, editingKey, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        override_key:         editingKey ?? '',
        override_value:       '',
        reason:               '',
        expires_at:           '',
        notify_user:          true,
        notification_message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.tenants.overrides.apply', { tenant: tenant.id }), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="w-[480px] bg-slate-900 overflow-y-auto border-l border-slate-800 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-7 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white">Apply Override</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {tenant.name} · <span className="text-indigo-400 font-semibold">{tenant.plan}</span> plan
                        </p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-7 flex flex-col gap-5 flex-1">
                    {/* Info banner */}
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <Zap size={18} className="text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-300/80">
                            This override takes effect <strong>immediately</strong> and invalidates the cache. The tenant will see the change on their next request.
                        </p>
                    </div>

                    {/* Limit key */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Limit Key</label>
                        <select
                            value={data.override_key}
                            onChange={e => setData('override_key', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            required
                        >
                            <option value="">— Select a limit —</option>
                            {availableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        {errors.override_key && <span className="text-red-400 text-xs">{errors.override_key}</span>}
                    </div>

                    {/* New value */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">New Value</label>
                        <input
                            type="text"
                            value={data.override_value}
                            onChange={e => setData('override_value', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Leave blank = unlimited (null)"
                        />
                        <p className="text-xs text-slate-600">Use a number for caps, 1/0 for features, or blank for unlimited.</p>
                        {errors.override_value && <span className="text-red-400 text-xs">{errors.override_value}</span>}
                    </div>

                    {/* Reason */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Internal Reason</label>
                        <input
                            type="text"
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Sales concession, AppSumo deal"
                        />
                    </div>

                    {/* Expires at */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Expires At (optional)</label>
                        <input
                            type="datetime-local"
                            value={data.expires_at}
                            onChange={e => setData('expires_at', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Notify user toggle */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <button
                                type="button"
                                onClick={() => setData('notify_user', !data.notify_user)}
                                className={`w-10 h-5 rounded-full p-0.5 transition-all ${data.notify_user ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${data.notify_user ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-sm font-semibold text-slate-300">Send in-app notification to tenant</span>
                        </label>
                        {data.notify_user && (
                            <textarea
                                value={data.notification_message}
                                onChange={e => setData('notification_message', e.target.value)}
                                rows={3}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Custom message (blank = auto-generated)"
                            />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.override_key}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Zap size={16} />
                            {processing ? 'Applying…' : 'Apply Override'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OverrideDetail({ tenant, effective_limits, override_history, available_keys }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingKey, setEditingKey] = useState(null);

    const removeOverride = (overrideId) => {
        if (confirm('Remove this override? The tenant will immediately revert to plan defaults.')) {
            router.delete(route('platform.tenants.overrides.remove', {
                tenant: tenant.id,
                override: overrideId,
            }));
        }
    };

    const openDrawerFor = (key = null) => {
        setEditingKey(key);
        setDrawerOpen(true);
    };

    // Active overrides from history
    const activeOverrides = override_history.filter(o => !o.expires_at || new Date(o.expires_at) > new Date());

    return (
        <OneGlanceLayout title={`Overrides — ${tenant.name}`} mode="admin" activeMenu="Tenant Overrides">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-8">
                <Link
                    href={route('platform.tenants.overrides')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors font-semibold text-sm"
                >
                    <ArrowLeft size={16} /> Tenant Overrides
                </Link>
                <span className="text-slate-700">/</span>
                <span className="text-slate-300 font-bold">{tenant.name}</span>
            </div>

            {/* Tenant Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-8 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl font-black text-indigo-400">
                        {tenant.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-white">{tenant.name}</h2>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ID #{tenant.id}</span>
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                                {tenant.plan}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                tenant.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                                {tenant.status}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => openDrawerFor()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 shrink-0"
                    >
                        <Zap size={17} /> Add Override
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Overrides</span>
                        <span className="text-3xl font-black text-indigo-400 mt-2">{activeOverrides.length}</span>
                    </div>
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Limit Keys</span>
                        <span className="text-3xl font-black text-slate-300 mt-2">{Object.keys(effective_limits).length}</span>
                    </div>
                </div>
            </div>

            {/* Effective Limits Grid */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Effective Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.entries(effective_limits).map(([key, info]) => {
                        const hasOverride = info.override !== null && info.override !== undefined;
                        return (
                            <div
                                key={key}
                                className={`rounded-2xl border p-5 transition-all ${
                                    hasOverride
                                    ? 'bg-amber-500/5 border-amber-500/20'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">{key}</span>
                                    {hasOverride ? (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            <Zap size={10} /> Override
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            <CheckCircle size={10} /> Plan Default
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-end justify-between gap-2">
                                    <div>
                                        <div className="text-2xl font-black text-white">
                                            {info.effective === null ? '∞' : String(info.effective)}
                                        </div>
                                        {hasOverride && (
                                            <div className="text-xs text-slate-600 mt-0.5">
                                                Plan default: <span className="text-slate-500">{info.plan_default === null ? '∞' : String(info.plan_default)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => openDrawerFor(key)}
                                        className="p-2 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-all"
                                        title="Edit this override"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>

                                {info.reason && (
                                    <p className="text-xs text-amber-400/60 mt-2 border-t border-amber-500/10 pt-2">{info.reason}</p>
                                )}
                                {info.expires_at && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5">
                                        <Clock size={11} />
                                        <span>Expires {new Date(info.expires_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Override History */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Override History</h3>
                {override_history.length === 0 ? (
                    <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                        <Info size={36} className="mx-auto mb-3 text-slate-700" />
                        <p className="text-slate-600 font-medium">No overrides have been applied to this tenant yet.</p>
                    </div>
                ) : (
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50">
                                    {['Key', 'Value', 'Original', 'Reason', 'Expires', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {override_history.map((o, i) => {
                                    const isExpired = o.expires_at && new Date(o.expires_at) < new Date();
                                    return (
                                        <tr
                                            key={o.id}
                                            className={`transition-colors ${i > 0 ? 'border-t border-slate-800' : ''} ${isExpired ? 'opacity-50' : 'hover:bg-slate-800/30'}`}
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs text-indigo-400">{o.override_key}</td>
                                            <td className="px-5 py-3.5 font-bold text-white">{o.override_value ?? <span className="text-slate-500">∞ unlimited</span>}</td>
                                            <td className="px-5 py-3.5 text-slate-500">{o.original_value ?? '—'}</td>
                                            <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{o.reason || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                {o.expires_at ? (
                                                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                                                        <Clock size={12} />
                                                        {isExpired ? 'Expired ' : ''}{new Date(o.expires_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-emerald-400 font-semibold">Permanent</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {!isExpired && (
                                                    <button
                                                        onClick={() => removeOverride(o.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold"
                                                    >
                                                        <RotateCcw size={12} /> Revert
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

            {/* Override Drawer */}
            {drawerOpen && (
                <OverrideDrawer
                    open={drawerOpen}
                    tenant={tenant}
                    availableKeys={available_keys}
                    editingKey={editingKey}
                    onClose={() => { setDrawerOpen(false); setEditingKey(null); }}
                />
            )}
        </OneGlanceLayout>
    );
}
