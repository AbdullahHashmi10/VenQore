import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldAlert, CheckCircle, Bug, Filter, ArrowLeft, Terminal, MonitorSmartphone, Sparkles } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

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
                        <Link href={route('platform.dashboard')} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="text-red-500" size={24} />
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">System Health</h1>
                            </div>
                            <p className="text-slate-400 font-medium mt-1">Platform-wide frontend and backend logs.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <button onClick={() => setFilter(0)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'open' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            Open Errors
                        </button>
                        <button onClick={() => setFilter(1)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            Resolved
                        </button>
                    </div>

                    {statusFilter === 'open' && errors.data.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={detectFixes}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
                                title="Auto-detect fixed bugs based on code updates."
                            >
                                <Sparkles size={16} />
                                Scan for Fixes
                            </button>
                            <button 
                                onClick={resolveAll}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                Resolve All
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar flex gap-8">
                    
                    {/* List */}
                    <div className="flex-1 max-w-4xl flex flex-col gap-4">
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={() => setFilter(filters.resolved, null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!filters.type ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>All Types</button>
                            <button onClick={() => setFilter(filters.resolved, 'backend')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.type === 'backend' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}><Terminal size={12}/> Backend</button>
                            <button onClick={() => setFilter(filters.resolved, 'frontend')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${filters.type === 'frontend' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}><MonitorSmartphone size={12}/> Frontend</button>
                        </div>

                        {errors.data.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <CheckCircle className="mx-auto text-emerald-500 mb-4 opacity-50" size={48} />
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Clean slate</h3>
                                <p className="text-sm text-slate-500">No {statusFilter} tracking notifications found.</p>
                            </div>
                        ) : (
                            errors.data.map(err => (
                                    <div 
                                        key={err.id} 
                                        onClick={() => setSelected(err)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all group relative ${selected?.id === err.id ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50 shadow-md' : 'bg-white border-slate-200 hover:border-red-300 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-600'}`}
                                    >
                                        {!err.is_resolved && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); resolveError(err.id); }}
                                                className="absolute top-4 right-4 p-2 rounded-xl bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 z-10"
                                                title="Quick Resolve"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {err.type === 'frontend' ? <MonitorSmartphone className="text-amber-500" size={18} /> : <Terminal className="text-red-500" size={18} />}
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 uppercase tracking-wider">{err.type}</span>
                                                {err.status_code && <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">HTTP {err.status_code}</span>}
                                                <span className="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{err.occurrence_count}x Events</span>
                                            </div>
                                            <span className={`text-xs font-mono transition-all ${selected?.id === err.id ? 'pr-8' : ''} text-slate-400`}>{new Date(err.last_seen_at).toLocaleString()}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate pr-12">{err.message}</h3>
                                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                            <div className="truncate max-w-md">{err.file ? `${err.file}:${err.line}` : (err.url || 'Unknown Source')}</div>
                                            {err.tenant && <div className="font-bold shrink-0 ml-4 py-1 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>{err.tenant.name}</div>}
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
                        <div className="w-96 flex-shrink-0 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl sticky top-0 h-fit flex flex-col max-h-[calc(100vh-140px)]">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Bug className="text-red-500" />
                                Error Details
                            </h3>
                            
                            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Message</div>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 break-words">{selected.message}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Store / Tenant</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{selected.tenant?.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">User</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{selected.user?.name || 'N/A'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">URL / Endpoint</div>
                                        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all bg-slate-50 dark:bg-slate-900 p-2 rounded">{selected.url || 'N/A'}</div>
                                    </div>
                                </div>

                                {selected.stack_trace && (
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Stack Trace Snippet</div>
                                        <pre className="text-[10px] font-mono whitespace-pre-wrap bg-slate-900 text-red-300 p-3 rounded-xl overflow-x-auto border border-slate-800 max-h-48">
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
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <textarea 
                                        value={resolveNote}
                                        onChange={e => setResolveNote(e.target.value)}
                                        placeholder="Resolution note (optional)"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 mb-4 text-slate-800 dark:text-slate-200"
                                        rows="2"
                                    ></textarea>
                                    <button 
                                        onClick={resolveError}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex justify-center items-center gap-2"
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
