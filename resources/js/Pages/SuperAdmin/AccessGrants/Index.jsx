import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell
import {
    Gift, Plus, Copy, CheckCircle, XCircle, Clock, Ban, RotateCcw,
    Trash2, Link as LinkIcon, ExternalLink
} from 'lucide-react';

// ── Status resolution ──────────────────────────────────────────────────────

function grantStatus(grant) {
    if (grant.revoked_at) return { label: 'Revoked', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Ban };
    if (grant.expires_at && new Date(grant.expires_at) < new Date() && grant.redemption_count === 0) {
        return { label: 'Expired (unused)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock };
    }
    if (grant.redemption_count >= grant.max_redemptions) {
        return { label: 'Fully Redeemed', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: CheckCircle };
    }
    return { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle };
}

function durationLabel(grant) {
    const unit = grant.duration_value === 1 ? grant.duration_unit : `${grant.duration_unit}s`;
    return `${grant.duration_value} ${unit.charAt(0).toUpperCase()}${unit.slice(1)}`;
}

// ── Copy-to-clipboard button ────────────────────────────────────────────────

function CopyLinkButton({ url, primary = false }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Fallback for environments without clipboard permission
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={copy}
            className={primary
                ? "flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all"
                : "flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold transition-all border border-white/10"}
        >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
        </button>
    );
}

// ── New Grant Drawer ─────────────────────────────────────────────────────────

function NewGrantDrawer({ open, onClose, plans, onCreated }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        plan_id: plans[0]?.id ?? '',
        duration_value: 1,
        duration_unit: 'year',
        label: '',
        max_redemptions: 1,
        expires_at: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.access-grants.store'), {
            onSuccess: () => {
                reset();
                onCreated();
            },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/50" onClick={onClose} />
            <div className="w-[480px] bg-slate-900 border-l border-white/10 overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-7 py-5 border-b border-white/10">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Gift size={18} className="text-indigo-400" /> New Gift Link
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
                </div>

                <form onSubmit={submit} className="px-7 py-6 space-y-5">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Plan to Grant</label>
                        <select
                            value={data.plan_id}
                            onChange={e => setData('plan_id', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.display_name || p.name}</option>
                            ))}
                        </select>
                        {errors.plan_id && <p className="text-xs text-red-400 mt-1">{errors.plan_id}</p>}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Duration — type any amount you want
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="1"
                                value={data.duration_value}
                                onChange={e => setData('duration_value', e.target.value)}
                                className="w-24 bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <select
                                value={data.duration_unit}
                                onChange={e => setData('duration_unit', e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="day">Days</option>
                                <option value="month">Months</option>
                                <option value="year">Years</option>
                            </select>
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">e.g. 1 Month, 18 Months, 5 Years — anything you want.</p>
                        {(errors.duration_value || errors.duration_unit) && (
                            <p className="text-xs text-red-400 mt-1">{errors.duration_value || errors.duration_unit}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Your Note (private — never shown to the customer)
                        </label>
                        <input
                            type="text"
                            value={data.label}
                            onChange={e => setData('label', e.target.value)}
                            placeholder="e.g. Ahmed — referral gift"
                            className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Max Uses</label>
                            <input
                                type="number"
                                min="1"
                                value={data.max_redemptions}
                                onChange={e => setData('max_redemptions', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">1 = single customer only</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Link Expires</label>
                            <input
                                type="date"
                                value={data.expires_at}
                                onChange={e => setData('expires_at', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">Blank = never</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={onClose} className="flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50">
                            {processing ? 'Creating…' : 'Create Gift Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Just-Created Link Banner ────────────────────────────────────────────────

function NewLinkBanner({ url, onDismiss }) {
    return (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-400">Gift link created — send this to your customer:</p>
                    <p className="text-xs text-slate-300 font-mono truncate mt-0.5">{url}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <CopyLinkButton url={url} primary />
                <button onClick={onDismiss} className="text-slate-500 hover:text-white text-lg px-2">✕</button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccessGrantsIndex({ grants, plans }) {
    const { flash } = usePage().props;
    const [showDrawer, setShowDrawer] = useState(false);
    const [newUrl, setNewUrl] = useState(flash?.new_grant_url ?? null);

    useEffect(() => {
        if (flash?.new_grant_url) setNewUrl(flash.new_grant_url);
    }, [flash?.new_grant_url]);

    const revoke = (grant) => {
        if (confirm(`Revoke this gift link${grant.label ? ` ("${grant.label}")` : ''}? It will stop working immediately.`)) {
            router.post(route('platform.access-grants.revoke', { grant: grant.id }));
        }
    };

    const unrevoke = (grant) => {
        router.post(route('platform.access-grants.unrevoke', { grant: grant.id }));
    };

    const destroy = (grant) => {
        if (confirm('Delete this unused gift link permanently?')) {
            router.delete(route('platform.access-grants.destroy', { grant: grant.id }));
        }
    };

    const stats = {
        total: grants.length,
        active: grants.filter(g => !g.revoked_at && g.redemption_count < g.max_redemptions && (!g.expires_at || new Date(g.expires_at) > new Date())).length,
        redeemed: grants.reduce((s, g) => s + g.redemption_count, 0),
        revoked: grants.filter(g => g.revoked_at).length,
    };

    return (
        <OneGlanceLayout title="Gift Access Links" mode="admin">
            <Head title="Gift Access Links" />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Gift className="text-indigo-400" />
                            Gift Access Links
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Generate a link that gives a customer any plan for any duration you choose — no payment required.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDrawer(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={16} /> New Gift Link
                    </button>
                </div>

                {newUrl && <NewLinkBanner url={newUrl} onDismiss={() => setNewUrl(null)} />}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Links</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl">
                        <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest mb-1">Active</p>
                        <p className="text-3xl font-black text-emerald-400">{stats.active}</p>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl">
                        <p className="text-indigo-500/60 text-xs font-bold uppercase tracking-widest mb-1">Redemptions</p>
                        <p className="text-3xl font-black text-indigo-400">{stats.redeemed}</p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl">
                        <p className="text-red-500/60 text-xs font-bold uppercase tracking-widest mb-1">Revoked</p>
                        <p className="text-3xl font-black text-red-400">{stats.revoked}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Plan &amp; Duration</th>
                                    <th className="px-6 py-4">Note</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Uses</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {grants.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <Gift size={48} className="opacity-20" />
                                                <p>No gift links yet. Create your first one above.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : grants.map(grant => {
                                    const status = grantStatus(grant);
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr key={grant.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-sm">{grant.plan?.display_name || grant.plan?.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{durationLabel(grant)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400 max-w-[180px] truncate">
                                                {grant.label || <span className="text-slate-600">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                                    <StatusIcon size={11} /> {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {grant.redemption_count} / {grant.max_redemptions}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(grant.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <CopyLinkButton url={`${window.location.origin}/gift/${grant.token}`} />
                                                    {grant.revoked_at ? (
                                                        <button onClick={() => unrevoke(grant)} title="Re-activate"
                                                            className="p-1.5 text-emerald-400/70 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-all">
                                                            <RotateCcw size={14} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => revoke(grant)} title="Revoke"
                                                            className="p-1.5 text-amber-400/70 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all">
                                                            <XCircle size={14} />
                                                        </button>
                                                    )}
                                                    {grant.redemption_count === 0 && (
                                                        <button onClick={() => destroy(grant)} title="Delete"
                                                            className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <NewGrantDrawer
                open={showDrawer}
                onClose={() => setShowDrawer(false)}
                plans={plans}
                onCreated={() => setShowDrawer(false)}
            />
        </OneGlanceLayout>
    );
}
