import React, { useMemo, useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Sparkles, ArrowRight, Check, X, AlertTriangle, Loader2,
    PlusCircle, MinusCircle, HelpCircle, ShieldAlert,
} from 'lucide-react';
import Toggle from '@/Components/Toggle';

const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

/*
|==============================================================================
| Builder/Index — "add modules any time, no extra cost within your plan."
|==============================================================================
| This is the screen EnsureModule::refuse() and the report gate have always
| bounced customers toward. Every write here goes through the same
| resolve -> validate -> apply path as onboarding, via BuilderController,
| so nothing switched on here can produce a configuration the AI pipeline
| would have refused to produce itself.
|==============================================================================
*/
export default function BuilderIndex({ modules = [], groupLabels = {}, highlight = null, businessType = null }) {
    const { store } = usePage().props;

    const [moduleState, setModuleState] = useState(() =>
        Object.fromEntries(modules.map((m) => [m.key, !!m.enabled]))
    );
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState(null);
    const [pendingDisable, setPendingDisable] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modifyText, setModifyText] = useState('');
    const [modifyBusy, setModifyBusy] = useState(false);
    const [modifyResult, setModifyResult] = useState(null);

    const byKey = useMemo(() => Object.fromEntries(modules.map((m) => [m.key, m])), [modules]);

    const byGroup = useMemo(() => {
        const groups = {};
        modules.forEach((m) => {
            const g = m.group || 'G';
            (groups[g] = groups[g] || []).push(m);
        });
        return groups;
    }, [modules]);

    const dirty = useMemo(
        () => modules.some((m) => !!moduleState[m.key] !== !!m.enabled),
        [moduleState, modules]
    );

    const highlightMod = highlight ? byKey[highlight] : null;

    const routeArgs = (extra = {}) => ({ store_slug: store?.slug, ...extra });

    const runPreview = async (nextState) => {
        setBusy(true);
        setError('');
        try {
            const keys = Object.keys(nextState).filter((k) => nextState[k]);
            const { data } = await axios.post(route('store.builder.preview', routeArgs()), { modules: keys });
            if (data.success) {
                setPreview(data);
                const synced = {};
                modules.forEach((m) => { synced[m.key] = data.modules.includes(m.key); });
                setModuleState(synced);
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Couldn't check that change — try again.");
        } finally {
            setBusy(false);
        }
    };

    const handleToggleOn = (mod) => {
        setError('');
        setNotice('');
        const next = { ...moduleState, [mod.key]: true };
        setModuleState(next);
        runPreview(next);
    };

    const startDisable = async (mod) => {
        setError('');
        setNotice('');
        setBusy(true);
        try {
            const { data } = await axios.get(
                route('store.builder.data-at-stake', routeArgs({ module: mod.key }))
            );
            if (data.success) {
                setPendingDisable({ module: mod, atStake: data.at_stake || {}, cascade: data.cascade || [mod.key] });
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Couldn't check that module — try again.");
        } finally {
            setBusy(false);
        }
    };

    const confirmDisable = () => {
        if (!pendingDisable) return;
        const next = { ...moduleState };
        pendingDisable.cascade.forEach((k) => { next[k] = false; });
        setPendingDisable(null);
        setModuleState(next);
        runPreview(next);
    };

    const answerQuestion = (optionKey) => {
        const next = { ...moduleState, [optionKey]: true };
        setModuleState(next);
        runPreview(next);
    };

    const resolveBlockTogether = (blockedKey, dependents) => {
        const next = { ...moduleState };
        next[blockedKey] = false;
        dependents.forEach((k) => { next[k] = false; });
        setModuleState(next);
        runPreview(next);
    };

    const discardChanges = () => {
        setModuleState(Object.fromEntries(modules.map((m) => [m.key, !!m.enabled])));
        setPreview(null);
        setError('');
        setNotice('');
    };

    const applyChanges = async () => {
        setBusy(true);
        setError('');
        try {
            const keys = Object.keys(moduleState).filter((k) => moduleState[k]);
            const { data } = await axios.post(route('store.builder.apply', routeArgs()), { modules: keys });
            if (data.success) {
                setNotice('Saved — your system is updated.');
                router.reload();
            }
        } catch (e) {
            const resp = e?.response?.data;
            if (resp?.reason === 'questions_pending') {
                setPreview((p) => ({ ...(p || {}), questions: resp.questions }));
                setError('Answer the question below, then save again.');
            } else if (resp?.reason === 'disable_blocked') {
                setError(resp.message);
            } else {
                setError(resp?.message || "Couldn't save changes — try again.");
            }
        } finally {
            setBusy(false);
        }
    };

    const submitModify = async (e) => {
        e.preventDefault();
        if (!modifyText.trim()) return;
        setModifyBusy(true);
        setModifyResult(null);
        try {
            const { data } = await axios.post(route('store.builder.modify', routeArgs()), { text: modifyText });
            setModifyResult(data);
            if (data.success && data.intent !== 'ADD_CARD') {
                setModifyText('');
                router.reload();
            }
        } catch (e) {
            setModifyResult(e?.response?.data || { success: false, message: "Couldn't process that — try again." });
        } finally {
            setModifyBusy(false);
        }
    };

    const questions = preview?.questions || [];
    const blocks = preview?.blocks || {};
    const hasBlocks = Object.keys(blocks).length > 0;
    const addedEntries = Object.entries(preview?.added || {});

    return (
        <OneGlanceLayout title="Builder" activeMenu="Settings">
            <Head title="Builder" />

            <div className="max-w-5xl mx-auto py-6 space-y-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-600">
                        <Sparkles size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Builder</span>
                    </div>
                    <h1 className="text-2xl font-bold text-ink mt-1">Change what your system does</h1>
                    <p className="text-sm text-ink-muted mt-1">
                        Turn modules on or off any time, at no extra cost within your plan. Nothing you've entered is
                        ever deleted when a module is switched off — it's just hidden until you turn it back on.
                        {businessType && (
                            <span className="ml-1 text-ink-muted">
                                Set up as <span className="font-semibold text-ink-secondary">{businessType.replace(/_/g, ' ')}</span>.
                            </span>
                        )}
                    </p>
                    <Link
                        href={route('store.onboarding.v2', routeArgs())}
                        className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                        <Sparkles size={14} />
                        Run the guided setup wizard again
                    </Link>
                </div>

                {highlightMod && !moduleState[highlightMod.key] && (
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-brand-500/40 bg-brand-500/10">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={20} className="text-brand-600 shrink-0" />
                            <p className="text-sm text-ink">
                                You just tried to use <span className="font-bold">{highlightMod.label}</span>, but it isn't
                                turned on yet.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggleOn(highlightMod)}
                            className="shrink-0 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
                        >
                            Turn it on
                        </button>
                    </div>
                )}

                {/* Plain-language box */}
                <div className="p-5 rounded-xl border border-line bg-sunken">
                    <label className="block text-sm font-bold text-ink-secondary mb-2">
                        Or just tell it what you want
                    </label>
                    <form onSubmit={submitModify} className="flex gap-2">
                        <input
                            type="text"
                            value={modifyText}
                            onChange={(e) => setModifyText(e.target.value)}
                            placeholder='e.g. "turn on invoicing" or "call customers patients"'
                            className="flex-1 px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            maxLength={200}
                        />
                        <button
                            type="submit"
                            disabled={modifyBusy || !modifyText.trim()}
                            className="px-4 py-3 rounded-xl bg-ink text-surface text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            {modifyBusy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        </button>
                    </form>
                    {modifyResult && (
                        <div
                            className={`mt-3 text-sm rounded-lg px-3 py-2 ${
                                modifyResult.success
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-600 border border-red-500/30'
                            }`}
                        >
                            {modifyResult.message}
                            {modifyResult.intent === 'ADD_CARD' && (
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('store.dashboard', routeArgs()))}
                                    className="ml-2 underline font-semibold"
                                >
                                    Go to dashboard
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 flex items-center gap-2">
                        <AlertTriangle size={16} className="shrink-0" /> {error}
                    </div>
                )}

                {questions.map((q) => (
                    <div key={q.for} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                        <div className="flex items-start gap-2">
                            <HelpCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-ink font-medium">{q.prompt}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {q.options.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => answerQuestion(opt)}
                                            className="px-3 py-1.5 rounded-lg bg-surface border border-line text-sm font-semibold hover:border-brand-500 hover:text-brand-600 transition-colors"
                                        >
                                            {byKey[opt]?.label || opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {hasBlocks && (
                    <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3">
                        {Object.entries(blocks).map(([key, verdict]) => (
                            <div key={key} className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-ink">{verdict.message}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => resolveBlockTogether(key, verdict.dependents)}
                                    className="shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-bold hover:border-red-500 hover:text-red-600 transition-colors"
                                >
                                    Turn these off together
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Module groups */}
                <div className="space-y-6">
                    {GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => (
                        <div key={g} className="rounded-xl border border-line bg-surface overflow-hidden">
                            <div className="px-5 py-3 border-b border-line bg-sunken">
                                <h2 className="text-sm font-bold text-ink-secondary uppercase tracking-wide">
                                    {groupLabels[g] || g}
                                </h2>
                            </div>
                            <div className="divide-y divide-line">
                                {byGroup[g].map((m) => {
                                    const enabled = !!moduleState[m.key];
                                    const isHighlighted = highlight === m.key;
                                    return (
                                        <div
                                            key={m.key}
                                            className={`px-5 ${isHighlighted ? 'ring-2 ring-inset ring-brand-500 bg-brand-500/5' : ''}`}
                                        >
                                            <Toggle
                                                enabled={enabled}
                                                onChange={(next) => (next ? handleToggleOn(m) : startDisable(m))}
                                                label={m.label}
                                                description={m.description}
                                                disabled={busy}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save bar */}
            {dirty && (
                <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-40 border-t border-line bg-surface/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4 shadow-2xl">
                    <div className="text-sm text-ink-secondary">
                        {addedEntries.length > 0 && (
                            <span>
                                Also turns on: {addedEntries.map(([k]) => byKey[k]?.label || k).join(', ')}.{' '}
                            </span>
                        )}
                        {notice && <span className="text-emerald-600 font-semibold">{notice}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={discardChanges}
                            disabled={busy}
                            className="px-4 py-2 rounded-lg border border-line text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={applyChanges}
                            disabled={busy || questions.length > 0}
                            className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Save changes
                        </button>
                    </div>
                </div>
            )}

            {/* Data-at-stake confirmation */}
            {pendingDisable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-amber-600">
                            <MinusCircle size={20} />
                            <h3 className="font-bold text-ink">Turn off {pendingDisable.module.label}?</h3>
                        </div>

                        {Object.keys(pendingDisable.atStake).length > 0 ? (
                            <div>
                                <p className="text-sm text-ink-muted mb-2">Nothing is deleted — this just gets hidden:</p>
                                <ul className="text-sm text-ink-secondary space-y-1">
                                    {Object.entries(pendingDisable.atStake).map(([table, count]) => (
                                        <li key={table} className="flex justify-between">
                                            <span className="capitalize">{table.replace(/_/g, ' ')}</span>
                                            <span className="font-semibold">{count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-ink-muted">No data on record for this module yet.</p>
                        )}

                        {pendingDisable.cascade.length > 1 && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-ink">
                                This also turns off:{' '}
                                <span className="font-semibold">
                                    {pendingDisable.cascade
                                        .filter((k) => k !== pendingDisable.module.key)
                                        .map((k) => byKey[k]?.label || k)
                                        .join(', ')}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setPendingDisable(null)}
                                className="px-4 py-2 rounded-lg border border-line text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDisable}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                            >
                                Turn it off
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
