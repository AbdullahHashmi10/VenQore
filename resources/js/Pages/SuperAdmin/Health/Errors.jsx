import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldAlert, CheckCircle, Bug, Filter, ArrowLeft, Terminal, MonitorSmartphone, Sparkles, Copy } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell

export default function Errors({ errors, filters }) {
    const [selected, setSelected] = useState(null);
    const [resolveNote, setResolveNote] = useState('');

    const statusFilter = filters.resolved ? 'resolved' : 'open';

    function setFilter(resolved, type = filters.type) {
        router.get(route('platform.health.errors'), { resolved, type }, { preserveState: true });
    }

    function resolveError(errId = selected?.id) {
        if (!errId) return;
        router.post(route('platform.health.errors.resolve', errId), { note: resolveNote }, {
            onSuccess: () => {
                if (selected?.id === errId) {
                    setSelected(null);
                    setResolveNote('');
                }
            }
        });
    }

    function resolveAll() {
        if (!confirm('Mark ALL current open errors as resolved?')) return;
        router.post(route('platform.health.errors.resolve-all'), {}, {
            onSuccess: () => setSelected(null)
        });
    }

    function detectFixes() {
        router.post(route('platform.health.errors.detect-fixes'), {}, {
            onFinish: () => setSelected(null)
        });
    }

    const copyToClipboard = (err) => {
        const text = `Error: ${err.message}\nFile: ${err.file || 'N/A'}:${err.line || 'N/A'}\nURL: ${err.url || 'N/A'}\nStore: ${err.tenant?.name || 'N/A'}\nUser: ${err.user?.name || 'N/A'}\nOccurrences: ${err.occurrence_count}x\nLast Seen: ${new Date(err.last_seen_at).toLocaleString()}\n\nStack Trace:\n${err.stack_trace || 'N/A'}`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Error details copied to clipboard!');
        });
    };

    const copyAllErrors = () => {
        if (errors.data.length === 0) return;
        const text = errors.data.map((err, idx) => {
            return `--- ERROR #${idx + 1} ---\nError: ${err.message}\nFile: ${err.file || 'N/A'}:${err.line || 'N/A'}\nURL: ${err.url || 'N/A'}\nStore: ${err.tenant?.name || 'N/A'}\nUser: ${err.user?.name || 'N/A'}\nOccurrences: ${err.occurrence_count}x\nLast Seen: ${new Date(err.last_seen_at).toLocaleString()}`;
        }).join('\n\n========================================\n\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('All error summaries copied to clipboard!');
        });
    };

    return (
        <OneGlanceLayout title="System Health" mode="admin">
            <Head title="Error Logs - System Health" />

            <div className="h-full flex flex-col relative overflow-hidden">
                {/* --- Unified Header Banner --- */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    padding: '32px',
                    borderRadius: '24px 24px 0 0',
                    marginBottom: 8
                }} className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href={route('platform.dashboard')} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-ink-muted transition-all border border-white/5">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="text-red-500" size={24} />
                                <h1 className="text-3xl font-bold text-white tracking-tight">System Health</h1>
                            </div>
                            <p className="text-ink-muted font-medium mt-1">Platform-wide frontend and backend logs.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <button onClick={() => setFilter(0)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'open' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg ' : 'text-ink-muted hover:text-white hover:bg-white/5'}`}>
                            Open Errors
                        </button>
                        <button onClick={() => setFilter(1)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg ' : 'text-ink-muted hover:text-white hover:bg-white/5'}`}>
                            Resolved
                        </button>
                    </div>

                    {errors.data.length > 0 && (
                        <div className="flex items-center gap-2">
                            {statusFilter === 'open' && (
                                <>
                                    <div className="relative group/hint">
                                        <button
                                            onClick={() => {
                                                if (!confirm('⚠️ HEURISTIC SCAN\n\nThis uses file modification times to guess which errors may be fixed. It does NOT confirm errors are actually resolved.\n\nAuto-resolved items will be labelled "[HEURISTIC]" — please verify each one manually.\n\nProceed?')) return;
                                                detectFixes();
                                            }}
                                            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                                            title="Heuristic only — estimates fixes by file modification times. Verify manually."
                                        >
                                            <Sparkles size={16} />
                                            Scan (Heuristic)
                                        </button>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/hint:block z-50 w-64 bg-amber-900/95 text-amber-100 text-xs rounded-xl p-3 border border-amber-600/30 shadow-xl pointer-events-none">
                                            ⚠️ <strong>Heuristic only.</strong> Marks errors as likely-fixed if the source file was modified after the error was last seen. Always verify manually — not a guaranteed fix.
                                        </div>
                                    </div>
                                    <button
                                        onClick={resolveAll}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Resolve All
                                    </button>
                                </>
                            )}
                            <button
                                onClick={copyAllErrors}
                                className="bg-neutral-600 hover:bg-interactive-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-neutral-500/25 flex items-center gap-2"
                                title="Copy all currently listed errors to clipboard"
                            >
                                <Copy size={16} />
                                Copy All
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar flex gap-8">

                    {/* List */}
                    <div className="flex-1 max-w-4xl flex flex-col gap-4">
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={() => setFilter(filters.resolved, null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!filters.type ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-500/30 dark:text-brand-300' : 'bg-white border-line text-ink-secondary dark:bg-surface dark:border-line dark:text-ink-muted'}`}>All Types</button>
                            <button onClick={() => setFilter(filters.resolved, 'backend')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.type === 'backend' ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-500/30 dark:text-brand-300' : 'bg-white border-line text-ink-secondary dark:bg-surface dark:border-line dark:text-ink-muted'}`}><Terminal size={12}/> Backend</button>
                            <button onClick={() => setFilter(filters.resolved, 'frontend')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.type === 'frontend' ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-500/30 dark:text-brand-300' : 'bg-white border-line text-ink-secondary dark:bg-surface dark:border-line dark:text-ink-muted'}`}><MonitorSmartphone size={12}/> Frontend</button>
                        </div>

                        {errors.data.length === 0 ? (
                            <div className="text-center py-20 bg-surface rounded-2xl border border-line">
                                <CheckCircle className="mx-auto text-emerald-500 mb-4 opacity-50" size={48} />
                                <h3 className="text-lg font-bold text-ink-secondary">Clean slate</h3>
                                <p className="text-sm text-ink-muted">No {statusFilter} tracking notifications found.</p>
                            </div>
                        ) : (
                            errors.data.map(err => (
                                    <div
                                        key={err.id}
                                        onClick={() => setSelected(err)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all group relative ${selected?.id === err.id ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50 shadow-md' : 'bg-white border-line hover:border-red-300 dark:bg-surface dark:border-line dark:hover:border-line-strong'}`}
                                    >
                                        {!err.is_resolved && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); resolveError(err.id); }}
                                                className="absolute top-4 right-4 p-2 rounded-xl bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-95 z-10"
                                                title="Quick Resolve"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(err); }}
                                            className={`absolute top-4 ${!err.is_resolved ? 'right-14' : 'right-4'} p-2 rounded-xl bg-neutral-500 hover:bg-interactive-hover text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-neutral-500/20 active:scale-95 z-10`}
                                            title="Copy Error Details"
                                        >
                                            <Copy size={16} />
                                        </button>

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {err.type === 'frontend' ? <MonitorSmartphone className="text-amber-500" size={18} /> : <Terminal className="text-red-500" size={18} />}
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-sunken text-ink-secondary dark:bg-app dark:text-ink-muted uppercase tracking-wider">{err.type}</span>
                                                {err.status_code && <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">HTTP {err.status_code}</span>}
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{err.occurrence_count}x Events</span>
                                            </div>
                                            <span className={`text-xs font-mono transition-all ${selected?.id === err.id ? 'pr-8' : ''} text-ink-muted`}>{new Date(err.last_seen_at).toLocaleString()}</span>
                                        </div>
                                        <h3 className="font-bold text-ink truncate pr-12">{err.message}</h3>
                                        <div className="mt-4 flex items-center justify-between text-xs text-ink-muted">
                                            <div className="truncate max-w-md">{err.file ? `${err.file}:${err.line}` : (err.url || 'Unknown Source')}</div>
                                            {err.tenant && <div className="font-bold shrink-0 ml-4 py-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-500"></div>{err.tenant.name}</div>}
                                        </div>
                                    </div>
                            ))
                        )}

                        {/* Pagination placeholder */}
                        {errors.last_page > 1 && (
                            <div className="flex gap-2 justify-center mt-6">
                                {/* Basic pagination logic can go here if needed, or rely on inertia links */}
                            </div>
                        )}
                    </div>

                    {/* Details Panel */}
                    {selected && (
                        <div className="w-96 flex-shrink-0 bg-surface rounded-2xl border border-line p-6 shadow-xl sticky top-0 h-fit flex flex-col max-h-[calc(100vh-140px)]">
                            <h3 className="text-lg font-bold text-ink mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Bug className="text-red-500" />
                                    Error Details
                                </span>
                                <button
                                    onClick={() => copyToClipboard(selected)}
                                    className="p-2 rounded-xl bg-sunken hover:bg-interactive-hover dark:bg-surface dark:hover:bg-interactive-hover text-ink-muted transition-all"
                                    title="Copy Details"
                                >
                                    <Copy size={16} />
                                </button>
                            </h3>

                            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-ink-muted uppercase mb-1">Message</div>
                                    <div className="text-sm font-medium text-ink-secondary break-words">{selected.message}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-ink-muted uppercase mb-1">Store / Tenant</div>
                                        <div className="text-sm font-medium text-ink-secondary">{selected.tenant?.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-ink-muted uppercase mb-1">User</div>
                                        <div className="text-sm font-medium text-ink-secondary">{selected.user?.name || 'N/A'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-xs font-bold text-ink-muted uppercase mb-1">URL / Endpoint</div>
                                        <div className="text-xs font-mono text-ink-secondary break-all bg-app p-2 rounded">{selected.url || 'N/A'}</div>
                                    </div>
                                </div>

                                {selected.stack_trace && (
                                    <div>
                                        <div className="text-xs font-bold text-ink-muted uppercase mb-1">Stack Trace Snippet</div>
                                        <pre className="text-2xs font-mono whitespace-pre-wrap bg-neutral-900 text-red-300 p-3 rounded-xl overflow-x-auto border border-neutral-800 max-h-48">
                                            {selected.stack_trace}
                                        </pre>
                                    </div>
                                )}

                                {selected.is_resolved && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl">
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Resolution Note</div>
                                        <div className="text-sm text-emerald-800 dark:text-emerald-200">{selected.resolution_note || 'Resolved without a specific note.'}</div>
                                    </div>
                                )}
                            </div>

                            {!selected.is_resolved && (
                                <div className="mt-6 pt-6 border-t border-line">
                                    <textarea
                                        value={resolveNote}
                                        onChange={e => setResolveNote(e.target.value)}
                                        placeholder="Resolution note (optional)"
                                        className="w-full bg-app border border-line rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 mb-4 text-ink"
                                        rows="2"
                                    ></textarea>
                                    <button
                                        onClick={resolveError}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Mark as Resolved
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </OneGlanceLayout>
    );
}
